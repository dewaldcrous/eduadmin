"""
Bulk Upload Service.
Parses Excel files and imports data into all EduAdmin modules.
Each sheet in the Excel file maps to a specific model.
Returns detailed results with success/error counts per row.
"""
import pandas as pd
from datetime import datetime, time
from django.db import transaction
from django.core.exceptions import ValidationError


class BulkUploadResult:
    """Tracks results for a single sheet import."""

    def __init__(self, sheet_name):
        self.sheet_name = sheet_name
        self.created = 0
        self.updated = 0
        self.skipped = 0
        self.errors = []

    def add_error(self, row, message):
        self.errors.append({"row": row, "error": str(message)})
        self.skipped += 1

    def to_dict(self):
        return {
            "sheet": self.sheet_name,
            "created": self.created,
            "updated": self.updated,
            "skipped": self.skipped,
            "errors": self.errors,
        }


def process_upload(file, school, uploaded_by):
    """
    Main entry point. Reads an Excel file and imports all sheets.
    Returns a list of BulkUploadResult dicts.
    """
    try:
        all_sheets = pd.read_excel(file, sheet_name=None, dtype=str)
    except Exception as e:
        return [{"sheet": "FILE", "created": 0, "updated": 0, "skipped": 0,
                 "errors": [{"row": 0, "error": f"Could not read file: {e}"}]}]

    results = []

    # Map sheet names to import functions
    importers = {
        "staff": _import_staff,
        "grades": _import_grades,
        "subjects": _import_subjects,
        "rooms": _import_rooms,
        "classrooms": _import_classrooms,
        "learners": _import_learners,
        "guardians": _import_guardians,
        "enrollments": _import_enrollments,
        "timetable_slots": _import_timetable_slots,
        "curriculum_outcomes": _import_curriculum_outcomes,
        "assessments": _import_assessments,
        "assessment_marks": _import_assessment_marks,
    }

    for sheet_name, df in all_sheets.items():
        sheet_key = sheet_name.strip().lower().replace(" ", "_")
        importer = importers.get(sheet_key)

        if importer:
            df = df.fillna("")
            result = importer(df, school, uploaded_by)
            results.append(result.to_dict())
        else:
            results.append({
                "sheet": sheet_name,
                "created": 0, "updated": 0, "skipped": 0,
                "errors": [{"row": 0, "error": f"Unknown sheet '{sheet_name}'. Valid sheets: {', '.join(importers.keys())}"}],
            })

    return results


# ─── STAFF ───────────────────────────────────────────────────────────────────
# Columns: username, first_name, last_name, email, role, phone, password

def _import_staff(df, school, uploaded_by):
    from apps.accounts.models import User

    result = BulkUploadResult("staff")
    required = ["username", "first_name", "last_name", "role"]

    for idx, row in df.iterrows():
        row_num = idx + 2  # Excel row (header is row 1)
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            role = str(row["role"]).strip().lower()
            valid_roles = ["teacher", "hod", "grade_head", "deputy", "principal", "admin"]
            if role not in valid_roles:
                result.add_error(row_num, f"Invalid role '{role}'. Must be one of: {', '.join(valid_roles)}")
                continue

            user, created = User.objects.update_or_create(
                username=str(row["username"]).strip(),
                defaults={
                    "first_name": str(row["first_name"]).strip(),
                    "last_name": str(row["last_name"]).strip(),
                    "email": str(row.get("email", "")).strip(),
                    "role": role,
                    "school": school,
                    "phone": str(row.get("phone", "")).strip(),
                },
            )
            if created:
                password = str(row.get("password", "EduAdmin2026!")).strip()
                user.set_password(password)
                user.save()
                result.created += 1
            else:
                result.updated += 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── GRADES ──────────────────────────────────────────────────────────────────
# Columns: name, grade_head_username (optional)

def _import_grades(df, school, uploaded_by):
    from apps.schools.models import Grade
    from apps.accounts.models import User

    result = BulkUploadResult("grades")

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            name = str(row.get("name", "")).strip()
            if not name:
                result.add_error(row_num, "Missing required field: name")
                continue

            defaults = {}
            gh_username = str(row.get("grade_head_username", "")).strip()
            if gh_username:
                try:
                    defaults["grade_head"] = User.objects.get(username=gh_username, school=school)
                except User.DoesNotExist:
                    result.add_error(row_num, f"Grade head '{gh_username}' not found")
                    continue

            _, created = Grade.objects.update_or_create(
                school=school, name=name, defaults=defaults,
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── SUBJECTS ────────────────────────────────────────────────────────────────
# Columns: name, code, hod_username (optional)

def _import_subjects(df, school, uploaded_by):
    from apps.schools.models import Subject
    from apps.accounts.models import User

    result = BulkUploadResult("subjects")
    required = ["name", "code"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            defaults = {"name": str(row["name"]).strip()}
            hod_username = str(row.get("hod_username", "")).strip()
            if hod_username:
                try:
                    defaults["hod"] = User.objects.get(username=hod_username, school=school)
                except User.DoesNotExist:
                    pass  # Non-critical, skip HOD assignment

            _, created = Subject.objects.update_or_create(
                school=school, code=str(row["code"]).strip(), defaults=defaults,
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── ROOMS ───────────────────────────────────────────────────────────────────
# Columns: name, capacity, room_type

def _import_rooms(df, school, uploaded_by):
    from apps.schools.models import Room

    result = BulkUploadResult("rooms")

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            name = str(row.get("name", "")).strip()
            if not name:
                result.add_error(row_num, "Missing required field: name")
                continue

            capacity = int(row.get("capacity", 30) or 30)
            room_type = str(row.get("room_type", "classroom")).strip().lower()
            if room_type not in ["classroom", "lab", "hall", "gym"]:
                room_type = "classroom"

            _, created = Room.objects.update_or_create(
                school=school, name=name,
                defaults={"capacity": capacity, "room_type": room_type},
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── CLASSROOMS ──────────────────────────────────────────────────────────────
# Columns: name, grade_name, room_name (optional), homeroom_teacher_username (optional)

def _import_classrooms(df, school, uploaded_by):
    from apps.schools.models import Classroom, Grade, Room
    from apps.accounts.models import User

    result = BulkUploadResult("classrooms")
    required = ["name", "grade_name"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            grade_name = str(row["grade_name"]).strip()
            try:
                grade = Grade.objects.get(school=school, name=grade_name)
            except Grade.DoesNotExist:
                result.add_error(row_num, f"Grade '{grade_name}' not found. Import grades first.")
                continue

            defaults = {"grade": grade}

            room_name = str(row.get("room_name", "")).strip()
            if room_name:
                try:
                    defaults["room"] = Room.objects.get(school=school, name=room_name)
                except Room.DoesNotExist:
                    pass

            hr_username = str(row.get("homeroom_teacher_username", "")).strip()
            if hr_username:
                try:
                    defaults["homeroom_teacher"] = User.objects.get(username=hr_username, school=school)
                except User.DoesNotExist:
                    pass

            _, created = Classroom.objects.update_or_create(
                school=school, name=str(row["name"]).strip(), defaults=defaults,
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── LEARNERS ────────────────────────────────────────────────────────────────
# Columns: username, first_name, last_name, email, date_of_birth, id_number,
#           home_language, special_needs, medical_notes

def _import_learners(df, school, uploaded_by):
    from apps.accounts.models import User
    from apps.learners.models import LearnerProfile

    result = BulkUploadResult("learners")
    required = ["username", "first_name", "last_name"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            user, created = User.objects.update_or_create(
                username=str(row["username"]).strip(),
                defaults={
                    "first_name": str(row["first_name"]).strip(),
                    "last_name": str(row["last_name"]).strip(),
                    "email": str(row.get("email", "")).strip(),
                    "role": "learner",
                    "school": school,
                },
            )
            if created:
                user.set_password("Learner2026!")
                user.save()

            # Profile
            dob = str(row.get("date_of_birth", "")).strip()
            profile_defaults = {
                "home_language": str(row.get("home_language", "")).strip(),
                "id_number": str(row.get("id_number", "")).strip(),
                "special_needs": str(row.get("special_needs", "")).strip(),
                "medical_notes": str(row.get("medical_notes", "")).strip(),
            }
            if dob:
                try:
                    profile_defaults["date_of_birth"] = pd.to_datetime(dob).date()
                except Exception:
                    pass

            LearnerProfile.objects.update_or_create(
                user=user, defaults=profile_defaults,
            )

            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── GUARDIANS ───────────────────────────────────────────────────────────────
# Columns: learner_username, guardian_name, relationship, phone, email, is_primary

def _import_guardians(df, school, uploaded_by):
    from apps.accounts.models import User
    from apps.learners.models import Guardian

    result = BulkUploadResult("guardians")
    required = ["learner_username", "guardian_name", "relationship", "phone"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            username = str(row["learner_username"]).strip()
            try:
                learner = User.objects.get(username=username, school=school, role="learner")
            except User.DoesNotExist:
                result.add_error(row_num, f"Learner '{username}' not found")
                continue

            is_primary = str(row.get("is_primary", "true")).strip().lower() in ["true", "yes", "1"]

            Guardian.objects.update_or_create(
                learner=learner.learner_profile,
                name=str(row["guardian_name"]).strip(),
                defaults={
                    "relationship": str(row["relationship"]).strip(),
                    "phone": str(row["phone"]).strip(),
                    "email": str(row.get("email", "")).strip(),
                    "is_primary": is_primary,
                },
            )
            result.created += 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── ENROLLMENTS ─────────────────────────────────────────────────────────────
# Columns: learner_username, classroom_name, year

def _import_enrollments(df, school, uploaded_by):
    from apps.accounts.models import User
    from apps.schools.models import Classroom
    from apps.learners.models import LearnerClassEnrollment

    result = BulkUploadResult("enrollments")
    required = ["learner_username", "classroom_name", "year"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            username = str(row["learner_username"]).strip()
            try:
                learner = User.objects.get(username=username, school=school, role="learner")
            except User.DoesNotExist:
                result.add_error(row_num, f"Learner '{username}' not found")
                continue

            cls_name = str(row["classroom_name"]).strip()
            try:
                classroom = Classroom.objects.get(school=school, name=cls_name)
            except Classroom.DoesNotExist:
                result.add_error(row_num, f"Classroom '{cls_name}' not found")
                continue

            year = int(row["year"])
            _, created = LearnerClassEnrollment.objects.update_or_create(
                learner=learner, classroom=classroom, year=year,
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── TIMETABLE SLOTS ────────────────────────────────────────────────────────
# Columns: day, period, start_time, end_time, teacher_username, classroom_name,
#           subject_code, room_name (optional), is_break

def _import_timetable_slots(df, school, uploaded_by):
    from apps.schools.models import Timetable, TimetableSlot, Classroom, Subject, Room
    from apps.accounts.models import User

    result = BulkUploadResult("timetable_slots")
    required = ["day", "period", "start_time", "end_time", "teacher_username",
                 "classroom_name", "subject_code"]

    # Get or create active timetable
    timetable = Timetable.objects.filter(school=school, status="active").first()
    if not timetable:
        current_year = datetime.now().year
        timetable, _ = Timetable.objects.get_or_create(
            school=school, term=1, year=current_year,
            defaults={"status": "active", "created_by": uploaded_by},
        )

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            day = str(row["day"]).strip().upper()[:3]
            if day not in ["MON", "TUE", "WED", "THU", "FRI"]:
                result.add_error(row_num, f"Invalid day '{day}'")
                continue

            teacher_username = str(row["teacher_username"]).strip()
            try:
                teacher = User.objects.get(username=teacher_username, school=school)
            except User.DoesNotExist:
                result.add_error(row_num, f"Teacher '{teacher_username}' not found")
                continue

            cls_name = str(row["classroom_name"]).strip()
            try:
                classroom = Classroom.objects.get(school=school, name=cls_name)
            except Classroom.DoesNotExist:
                result.add_error(row_num, f"Classroom '{cls_name}' not found")
                continue

            subject_code = str(row["subject_code"]).strip()
            try:
                subject = Subject.objects.get(school=school, code=subject_code)
            except Subject.DoesNotExist:
                result.add_error(row_num, f"Subject '{subject_code}' not found")
                continue

            defaults = {
                "start_time": _parse_time(str(row["start_time"]).strip()),
                "end_time": _parse_time(str(row["end_time"]).strip()),
                "teacher": teacher,
                "classroom": classroom,
                "subject": subject,
                "is_break": str(row.get("is_break", "false")).strip().lower() in ["true", "yes", "1"],
            }

            room_name = str(row.get("room_name", "")).strip()
            if room_name:
                try:
                    defaults["room"] = Room.objects.get(school=school, name=room_name)
                except Room.DoesNotExist:
                    pass

            _, created = TimetableSlot.objects.update_or_create(
                timetable=timetable,
                day=day,
                period=int(row["period"]),
                teacher=teacher,
                defaults=defaults,
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── CURRICULUM OUTCOMES ─────────────────────────────────────────────────────
# Columns: subject_code, grade_name, code, description, term

def _import_curriculum_outcomes(df, school, uploaded_by):
    from apps.schools.models import Subject, Grade
    from apps.planning.models import CurriculumOutcome

    result = BulkUploadResult("curriculum_outcomes")
    required = ["subject_code", "grade_name", "code", "description", "term"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            try:
                subject = Subject.objects.get(school=school, code=str(row["subject_code"]).strip())
            except Subject.DoesNotExist:
                result.add_error(row_num, f"Subject '{row['subject_code']}' not found")
                continue

            try:
                grade = Grade.objects.get(school=school, name=str(row["grade_name"]).strip())
            except Grade.DoesNotExist:
                result.add_error(row_num, f"Grade '{row['grade_name']}' not found")
                continue

            _, created = CurriculumOutcome.objects.update_or_create(
                subject=subject,
                grade=grade,
                code=str(row["code"]).strip(),
                defaults={
                    "description": str(row["description"]).strip(),
                    "term": int(row["term"]),
                },
            )
            result.created += 1 if created else 0
            result.updated += 0 if created else 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── ASSESSMENTS ─────────────────────────────────────────────────────────────
# Columns: name, assessment_type, subject_code, grade_name, date,
#           duration_minutes, total_marks, term_weight, term, year

def _import_assessments(df, school, uploaded_by):
    from apps.schools.models import Subject, Grade
    from apps.assessments.models import Assessment

    result = BulkUploadResult("assessments")
    required = ["name", "assessment_type", "subject_code", "grade_name",
                 "date", "total_marks", "term", "year"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            try:
                subject = Subject.objects.get(school=school, code=str(row["subject_code"]).strip())
            except Subject.DoesNotExist:
                result.add_error(row_num, f"Subject '{row['subject_code']}' not found")
                continue

            try:
                grade = Grade.objects.get(school=school, name=str(row["grade_name"]).strip())
            except Grade.DoesNotExist:
                result.add_error(row_num, f"Grade '{row['grade_name']}' not found")
                continue

            a_type = str(row["assessment_type"]).strip().lower()
            valid_types = ["test", "assignment", "exam", "practical", "oral", "project"]
            if a_type not in valid_types:
                result.add_error(row_num, f"Invalid type '{a_type}'")
                continue

            Assessment.objects.update_or_create(
                name=str(row["name"]).strip(),
                subject=subject,
                grade=grade,
                term=int(row["term"]),
                year=int(row["year"]),
                defaults={
                    "assessment_type": a_type,
                    "date": pd.to_datetime(str(row["date"])).date(),
                    "duration_minutes": int(row.get("duration_minutes", 60) or 60),
                    "total_marks": int(row["total_marks"]),
                    "term_weight": float(row.get("term_weight", 0) or 0),
                    "status": "scheduled",
                    "created_by": uploaded_by,
                },
            )
            result.created += 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── ASSESSMENT MARKS ────────────────────────────────────────────────────────
# Columns: assessment_name, learner_username, raw_mark, absent, feedback

def _import_assessment_marks(df, school, uploaded_by):
    from apps.accounts.models import User
    from apps.assessments.models import Assessment, AssessmentMark

    result = BulkUploadResult("assessment_marks")
    required = ["assessment_name", "learner_username", "raw_mark"]

    for idx, row in df.iterrows():
        row_num = idx + 2
        try:
            _check_required(row, required, row_num, result)
            if result.errors and result.errors[-1]["row"] == row_num:
                continue

            a_name = str(row["assessment_name"]).strip()
            try:
                assessment = Assessment.objects.get(
                    name=a_name, subject__school=school,
                )
            except Assessment.DoesNotExist:
                result.add_error(row_num, f"Assessment '{a_name}' not found")
                continue
            except Assessment.MultipleObjectsReturned:
                assessment = Assessment.objects.filter(
                    name=a_name, subject__school=school,
                ).first()

            username = str(row["learner_username"]).strip()
            try:
                learner = User.objects.get(username=username, school=school, role="learner")
            except User.DoesNotExist:
                result.add_error(row_num, f"Learner '{username}' not found")
                continue

            raw = float(row["raw_mark"])
            absent = str(row.get("absent", "false")).strip().lower() in ["true", "yes", "1"]
            pct = round((raw / assessment.total_marks) * 100, 1) if not absent and assessment.total_marks > 0 else 0

            AssessmentMark.objects.update_or_create(
                assessment=assessment,
                learner=learner,
                defaults={
                    "raw_mark": raw,
                    "percentage": pct,
                    "absent": absent,
                    "feedback": str(row.get("feedback", "")).strip(),
                    "captured_by": uploaded_by,
                },
            )
            result.created += 1

        except Exception as e:
            result.add_error(row_num, str(e))

    return result


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _check_required(row, fields, row_num, result):
    for field in fields:
        val = str(row.get(field, "")).strip()
        if not val:
            result.add_error(row_num, f"Missing required field: {field}")
            return


def _parse_time(time_str):
    for fmt in ["%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M:%S %p"]:
        try:
            return datetime.strptime(time_str, fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Cannot parse time: '{time_str}'. Use HH:MM format.")
