"""
Management command to seed the database with realistic dummy data.
Usage: python manage.py seed_data
"""
import random
from datetime import date, time, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, UserPreference
from apps.schools.models import (
    School, Grade, Subject, Room, Classroom,
    ClassTeacherAssignment, Timetable, TimetableSlot,
)
from apps.learners.models import (
    LearnerProfile, Guardian, LearnerClassEnrollment, AttendanceRecord,
)
from apps.planning.models import (
    CurriculumOutcome, LessonPlan, LessonDelivery, PlanApprovalLog,
)
from apps.assessments.models import Assessment, AssessmentMark
from apps.behaviour.models import (
    BehaviourLog, BehaviourFlag, BehaviourEscalation,
)
from apps.reflections.models import LessonReflection, ToDoTask, CarryOverPackage


class Command(BaseCommand):
    help = "Seed the database with realistic dummy data for Greenfield High School"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # ─── 1. SCHOOL ──────────────────────────────────────────────────
        school = School.objects.create(
            name="Greenfield High School",
            emis_number="400012345",
            address="42 Oak Avenue, Sandton, Johannesburg, 2196",
            province="Gauteng",
            district="Johannesburg North",
            phase="high",
        )
        self.stdout.write(self.style.SUCCESS(f"  Created school: {school.name}"))

        # ─── 2. STAFF USERS ─────────────────────────────────────────────
        principal = User.objects.create_user(
            username="principal.mokoena",
            password="EduAdmin2026!",
            first_name="Thabo",
            last_name="Mokoena",
            email="t.mokoena@greenfield.edu.za",
            role="principal",
            school=school,
            phone="011-555-0001",
        )
        school.principal = principal
        school.save()

        deputy = User.objects.create_user(
            username="deputy.vanwyk",
            password="EduAdmin2026!",
            first_name="Annemarie",
            last_name="Van Wyk",
            email="a.vanwyk@greenfield.edu.za",
            role="deputy",
            school=school,
            phone="011-555-0002",
        )

        admin_user = User.objects.create_user(
            username="admin.pillay",
            password="EduAdmin2026!",
            first_name="Priya",
            last_name="Pillay",
            email="p.pillay@greenfield.edu.za",
            role="admin",
            school=school,
            phone="011-555-0003",
        )

        # HODs
        hod_data = [
            ("hod.naidoo", "Kavitha", "Naidoo", "Mathematics"),
            ("hod.botha", "Johan", "Botha", "Natural Sciences"),
            ("hod.dlamini", "Sipho", "Dlamini", "Languages"),
            ("hod.fourie", "Elana", "Fourie", "Social Sciences"),
        ]
        hods = {}
        for username, first, last, dept in hod_data:
            hod = User.objects.create_user(
                username=username,
                password="EduAdmin2026!",
                first_name=first,
                last_name=last,
                email=f"{username}@greenfield.edu.za",
                role="hod",
                school=school,
                phone=f"011-555-{random.randint(1000, 9999)}",
            )
            hods[dept] = hod

        # Grade Heads
        grade_head_data = [
            ("gh.september", "Reginald", "September", "Grade 8"),
            ("gh.smith", "Karen", "Smith", "Grade 9"),
            ("gh.maharaj", "Ashwin", "Maharaj", "Grade 10"),
            ("gh.louw", "Petrus", "Louw", "Grade 11"),
            ("gh.ngcobo", "Nomsa", "Ngcobo", "Grade 12"),
        ]
        grade_heads = {}
        for username, first, last, grade_name in grade_head_data:
            gh = User.objects.create_user(
                username=username,
                password="EduAdmin2026!",
                first_name=first,
                last_name=last,
                email=f"{username}@greenfield.edu.za",
                role="grade_head",
                school=school,
                phone=f"011-555-{random.randint(1000, 9999)}",
            )
            grade_heads[grade_name] = gh

        # Teachers
        teacher_data = [
            ("t.williams", "Sarah", "Williams", "Mathematics"),
            ("t.modise", "Kagiso", "Modise", "Mathematics"),
            ("t.erasmus", "Hendrik", "Erasmus", "Physical Sciences"),
            ("t.mabaso", "Lindiwe", "Mabaso", "Life Sciences"),
            ("t.jordaan", "Elize", "Jordaan", "English Home Language"),
            ("t.zulu", "Bongani", "Zulu", "isiZulu"),
            ("t.patel", "Rajan", "Patel", "Accounting"),
            ("t.venter", "Marelize", "Venter", "Geography"),
            ("t.mahlangu", "Thandi", "Mahlangu", "History"),
            ("t.cloete", "Francois", "Cloete", "Life Orientation"),
            ("t.govender", "Naresh", "Govender", "Computer Applications Technology"),
            ("t.khoza", "Mandla", "Khoza", "Economic and Management Sciences"),
        ]
        teachers = {}
        for username, first, last, subject_name in teacher_data:
            t = User.objects.create_user(
                username=username,
                password="EduAdmin2026!",
                first_name=first,
                last_name=last,
                email=f"{username}@greenfield.edu.za",
                role="teacher",
                school=school,
                phone=f"011-555-{random.randint(1000, 9999)}",
            )
            teachers[username] = t

        self.stdout.write(self.style.SUCCESS(
            f"  Created {User.objects.filter(school=school).count()} staff members"
        ))

        # ─── 3. GRADES ──────────────────────────────────────────────────
        grades = {}
        for grade_name, gh_key in [
            ("Grade 8", "Grade 8"), ("Grade 9", "Grade 9"),
            ("Grade 10", "Grade 10"), ("Grade 11", "Grade 11"),
            ("Grade 12", "Grade 12"),
        ]:
            g = Grade.objects.create(
                school=school,
                name=grade_name,
                grade_head=grade_heads.get(gh_key),
            )
            grades[grade_name] = g

        # ─── 4. SUBJECTS ────────────────────────────────────────────────
        subject_data = [
            ("Mathematics", "MATH", "Mathematics"),
            ("Physical Sciences", "PHYS", "Natural Sciences"),
            ("Life Sciences", "LIFE", "Natural Sciences"),
            ("English Home Language", "ENG", "Languages"),
            ("isiZulu", "ZUL", "Languages"),
            ("Accounting", "ACC", "Social Sciences"),
            ("Geography", "GEO", "Social Sciences"),
            ("History", "HIST", "Social Sciences"),
            ("Life Orientation", "LO", "Social Sciences"),
            ("Computer Applications Technology", "CAT", "Mathematics"),
            ("Economic and Management Sciences", "EMS", "Social Sciences"),
        ]
        subjects = {}
        for name, code, dept in subject_data:
            s = Subject.objects.create(
                school=school,
                name=name,
                code=code,
                hod=hods.get(dept),
            )
            subjects[code] = s

        # ─── 5. ROOMS ───────────────────────────────────────────────────
        rooms = []
        for i in range(1, 21):
            r = Room.objects.create(
                school=school,
                name=f"Room {100 + i}",
                capacity=35,
                room_type="classroom",
            )
            rooms.append(r)

        # Special rooms
        Room.objects.create(school=school, name="Science Lab 1", capacity=30, room_type="lab")
        Room.objects.create(school=school, name="Science Lab 2", capacity=30, room_type="lab")
        Room.objects.create(school=school, name="Computer Lab", capacity=30, room_type="lab")
        Room.objects.create(school=school, name="School Hall", capacity=500, room_type="hall")
        Room.objects.create(school=school, name="Gymnasium", capacity=200, room_type="gym")

        # ─── 6. CLASSROOMS ──────────────────────────────────────────────
        classrooms = {}
        class_labels = ["A", "B", "C"]
        for grade_name, grade_obj in grades.items():
            grade_num = grade_name.split()[-1]
            for label in class_labels:
                cls_name = f"{grade_num}{label}"
                room = rooms.pop(0) if rooms else None
                c = Classroom.objects.create(
                    school=school,
                    grade=grade_obj,
                    name=cls_name,
                    room=room,
                )
                classrooms[cls_name] = c

        self.stdout.write(self.style.SUCCESS(
            f"  Created {len(grades)} grades, {len(subjects)} subjects, "
            f"{Classroom.objects.filter(school=school).count()} classrooms"
        ))

        # ─── 7. LEARNERS (30 per classroom) ─────────────────────────────
        first_names_m = [
            "Liam", "Ethan", "Thabo", "Sipho", "Kagiso", "Bongani", "Mandla",
            "Neo", "Tshepo", "Rajan", "Ahmed", "David", "Jason", "Michael", "Luke",
        ]
        first_names_f = [
            "Lerato", "Nomsa", "Thandi", "Aisha", "Priya", "Zanele", "Palesa",
            "Emma", "Chloe", "Ava", "Naledi", "Lindiwe", "Kefilwe", "Sarah", "Lisa",
        ]
        last_names = [
            "Mokoena", "Van der Merwe", "Naidoo", "Dlamini", "Williams",
            "Botha", "Pillay", "Zulu", "Maharaj", "September",
            "Smith", "Fourie", "Govender", "Mahlangu", "Khoza",
            "Louw", "Jordaan", "Erasmus", "Cloete", "Patel",
            "Ngcobo", "Venter", "Modise", "Adams", "Petersen",
            "Khumalo", "Sithole", "Mthembu", "Ndlovu", "Cele",
        ]

        learner_count = 0
        all_learners = {}

        for cls_name, classroom in classrooms.items():
            grade_num = int("".join(filter(str.isdigit, cls_name)))
            cls_learners = []

            for i in range(30):
                is_female = i % 2 == 0
                first = random.choice(first_names_f if is_female else first_names_m)
                last = random.choice(last_names)
                username = f"l.{first.lower()}.{last.lower().replace(' ', '')}.{cls_name.lower()}.{i}"

                learner = User.objects.create_user(
                    username=username,
                    password="Learner2026!",
                    first_name=first,
                    last_name=last,
                    email=f"{username}@learner.greenfield.edu.za",
                    role="learner",
                    school=school,
                )

                # Profile
                birth_year = 2026 - grade_num - 6
                LearnerProfile.objects.create(
                    user=learner,
                    date_of_birth=date(birth_year, random.randint(1, 12), random.randint(1, 28)),
                    home_language=random.choice(["English", "isiZulu", "Afrikaans", "Sesotho", "Setswana"]),
                )

                # Guardian
                Guardian.objects.create(
                    learner=learner.learner_profile,
                    name=f"{random.choice(['Mr', 'Mrs', 'Ms'])} {last}",
                    relationship=random.choice(["Mother", "Father", "Guardian"]),
                    phone=f"082-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    email=f"parent.{last.lower().replace(' ', '')}@email.co.za",
                    is_primary=True,
                )

                # Enrollment
                LearnerClassEnrollment.objects.create(
                    learner=learner,
                    classroom=classroom,
                    year=2026,
                )

                cls_learners.append(learner)
                learner_count += 1

            all_learners[cls_name] = cls_learners

        self.stdout.write(self.style.SUCCESS(f"  Created {learner_count} learners with profiles and guardians"))

        # ─── 8. TIMETABLE ───────────────────────────────────────────────
        timetable = Timetable.objects.create(
            school=school,
            term=1,
            year=2026,
            status="active",
            created_by=admin_user,
        )

        period_times = [
            (time(7, 45), time(8, 30)),   # P1
            (time(8, 30), time(9, 15)),   # P2
            (time(9, 15), time(10, 0)),   # P3
            (time(10, 20), time(11, 5)),  # P4 (after break)
            (time(11, 5), time(11, 50)),  # P5
            (time(11, 50), time(12, 35)), # P6
            (time(13, 0), time(13, 45)),  # P7 (after lunch)
        ]

        days = ["MON", "TUE", "WED", "THU", "FRI"]

        # Assign subjects to classrooms with teachers
        teacher_subject_map = {
            "t.williams": "MATH", "t.modise": "MATH",
            "t.erasmus": "PHYS", "t.mabaso": "LIFE",
            "t.jordaan": "ENG", "t.zulu": "ZUL",
            "t.patel": "ACC", "t.venter": "GEO",
            "t.mahlangu": "HIST", "t.cloete": "LO",
            "t.govender": "CAT", "t.khoza": "EMS",
        }

        slot_count = 0
        grade_10_slots = []

        for cls_name in ["10A", "10B", "10C"]:
            classroom = classrooms[cls_name]
            period_idx = 0

            for day in days:
                for subject_code, teacher_username in [
                    ("MATH", "t.williams"), ("ENG", "t.jordaan"),
                    ("PHYS", "t.erasmus"), ("LIFE", "t.mabaso"),
                    ("GEO", "t.venter"), ("HIST", "t.mahlangu"),
                    ("LO", "t.cloete"),
                ]:
                    p = period_idx % 7
                    start, end = period_times[p]

                    slot = TimetableSlot.objects.create(
                        timetable=timetable,
                        day=day,
                        period=p + 1,
                        start_time=start,
                        end_time=end,
                        teacher=teachers[teacher_username],
                        classroom=classroom,
                        subject=subjects[subject_code],
                    )
                    if cls_name == "10A":
                        grade_10_slots.append(slot)
                    slot_count += 1
                    period_idx += 1

        self.stdout.write(self.style.SUCCESS(f"  Created timetable with {slot_count} slots"))

        # ─── 9. ATTENDANCE RECORDS (last 2 weeks) ───────────────────────
        attendance_count = 0
        today = date.today()
        school_days = []
        for i in range(14, 0, -1):
            d = today - timedelta(days=i)
            if d.weekday() < 5:  # Mon-Fri
                school_days.append(d)

        for slot in grade_10_slots[:10]:  # First 10 slots for 10A
            classroom = slot.classroom
            cls_name = f"{classroom.grade.name.split()[-1]}{classroom.name}"
            learners = all_learners.get(cls_name, [])

            for school_day in school_days[:5]:
                for learner in learners:
                    status = random.choices(
                        ["present", "absent", "late"],
                        weights=[85, 10, 5],
                    )[0]
                    AttendanceRecord.objects.create(
                        learner=learner,
                        timetable_slot=slot,
                        date=school_day,
                        status=status,
                        absence_reason="Sick" if status == "absent" else "",
                        recorded_by=slot.teacher,
                    )
                    attendance_count += 1

        self.stdout.write(self.style.SUCCESS(f"  Created {attendance_count} attendance records"))

        # ─── 10. CURRICULUM OUTCOMES ─────────────────────────────────────
        outcomes = []
        math_topics = [
            ("CAPS-MATH-1.1", "Number patterns and sequences"),
            ("CAPS-MATH-1.2", "Algebraic expressions and equations"),
            ("CAPS-MATH-1.3", "Exponents and surds"),
            ("CAPS-MATH-2.1", "Functions and graphs"),
            ("CAPS-MATH-2.2", "Trigonometric functions"),
            ("CAPS-MATH-3.1", "Euclidean Geometry"),
            ("CAPS-MATH-3.2", "Analytical Geometry"),
            ("CAPS-MATH-4.1", "Statistics"),
            ("CAPS-MATH-4.2", "Probability"),
        ]
        for code, desc in math_topics:
            o = CurriculumOutcome.objects.create(
                subject=subjects["MATH"],
                grade=grades["Grade 10"],
                code=code,
                description=desc,
                term=1,
            )
            outcomes.append(o)

        # ─── 11. LESSON PLANS ────────────────────────────────────────────
        plan_count = 0
        plan_data = [
            ("Introduction to Number Patterns", "Learners identify and extend number patterns",
             "Guided examples, group work with pattern cards, individual practice",
             "Visual aids for struggling learners, extension problems for advanced"),
            ("Algebraic Expressions", "Simplify and factorise algebraic expressions",
             "Teacher demonstration, paired practice, worksheet",
             "Concrete manipulatives for visual learners"),
            ("Exponents: Laws and Applications", "Apply exponent laws to simplify expressions",
             "Interactive examples, mini whiteboard practice, exit ticket",
             "Step-by-step scaffolding for weaker learners"),
            ("Linear Functions", "Plot and interpret linear functions",
             "GeoGebra demonstration, graph plotting activity, real-world examples",
             "Pre-drawn axes for learners needing support"),
            ("Trigonometry Basics", "Calculate trig ratios for right-angled triangles",
             "Discovery activity with triangles, calculator practice, application problems",
             "Reference cards with trig ratios"),
        ]

        lesson_plans = []
        for i, (title, objectives, activities, diff) in enumerate(plan_data):
            if i < len(grade_10_slots):
                slot = grade_10_slots[i]
                plan = LessonPlan.objects.create(
                    timetable_slot=slot,
                    plan_type="official",
                    status=random.choice(["approved", "approved", "pending", "draft"]),
                    title=title,
                    objectives=objectives,
                    activities=activities,
                    differentiation=diff,
                    resources_note="Textbook Ch. " + str(i + 1) + ", printed worksheets",
                    submitted_by=slot.teacher,
                    approved_by=hods["Mathematics"] if random.random() > 0.3 else None,
                    version=1,
                )
                if outcomes:
                    plan.curriculum_outcomes.add(outcomes[i % len(outcomes)])
                lesson_plans.append(plan)
                plan_count += 1

                # Approval log
                if plan.status in ["approved", "pending"]:
                    PlanApprovalLog.objects.create(
                        lesson_plan=plan,
                        action="submitted",
                        actioned_by=slot.teacher,
                        feedback="",
                    )
                if plan.status == "approved":
                    PlanApprovalLog.objects.create(
                        lesson_plan=plan,
                        action="approved",
                        actioned_by=hods["Mathematics"],
                        feedback="Well structured lesson. Approved.",
                    )

        self.stdout.write(self.style.SUCCESS(
            f"  Created {plan_count} lesson plans with {len(outcomes)} curriculum outcomes"
        ))

        # ─── 12. LESSON DELIVERIES ───────────────────────────────────────
        for plan in lesson_plans[:3]:
            completion = random.choice(["full", "full", "partial"])
            LessonDelivery.objects.create(
                lesson_plan=plan,
                completion=completion,
                coverage_percent=100 if completion == "full" else random.randint(50, 80),
                delivered_by=plan.submitted_by,
            )

        # ─── 13. ASSESSMENTS & MARKS ─────────────────────────────────────
        assessments_created = []
        assessment_data = [
            ("Term 1 Test 1: Algebra", "test", 50, 15),
            ("Assignment 1: Number Patterns", "assignment", 30, 10),
            ("Practical: Graph Plotting", "practical", 20, 5),
            ("March Control Test", "test", 100, 25),
            ("Oral: Mathematical Presentation", "oral", 30, 5),
        ]

        for name, a_type, total, weight in assessment_data:
            a = Assessment.objects.create(
                name=name,
                assessment_type=a_type,
                subject=subjects["MATH"],
                grade=grades["Grade 10"],
                date=today - timedelta(days=random.randint(5, 30)),
                duration_minutes=60 if a_type == "test" else 30,
                total_marks=total,
                term_weight=weight,
                term=1,
                year=2026,
                status="completed",
                created_by=teachers["t.williams"],
            )
            a.classrooms.add(classrooms["10A"])
            assessments_created.append(a)

        # Marks for 10A learners
        marks_count = 0
        for assessment in assessments_created:
            for learner in all_learners.get("10A", []):
                absent = random.random() < 0.05
                if absent:
                    raw = 0
                else:
                    mean = assessment.total_marks * 0.6
                    std = assessment.total_marks * 0.15
                    raw = max(0, min(assessment.total_marks, round(random.gauss(mean, std))))

                pct = round((raw / assessment.total_marks) * 100, 1) if not absent else 0

                AssessmentMark.objects.create(
                    assessment=assessment,
                    learner=learner,
                    raw_mark=raw,
                    percentage=pct,
                    absent=absent,
                    captured_by=teachers["t.williams"],
                    feedback=random.choice([
                        "", "", "",
                        "Good effort, keep it up.",
                        "Needs more practice with factorisation.",
                        "Excellent work!",
                        "Please see me for extra help.",
                        "Shows improvement from last test.",
                    ]),
                )
                marks_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"  Created {len(assessments_created)} assessments with {marks_count} marks"
        ))

        # ─── 14. BEHAVIOUR LOGS & FLAGS ──────────────────────────────────
        behaviour_count = 0
        flag_count = 0

        for slot in grade_10_slots[:8]:
            cls_name = f"{slot.classroom.grade.name.split()[-1]}{slot.classroom.name}"
            learners = all_learners.get(cls_name, [])

            for school_day in school_days[:3]:
                for learner in learners:
                    rating = random.choices(
                        [1, 2, 3, 4, 5],
                        weights=[3, 7, 50, 30, 10],
                    )[0]

                    log = BehaviourLog.objects.create(
                        learner=learner,
                        timetable_slot=slot,
                        date=school_day,
                        rating=rating,
                        recorded_by=slot.teacher,
                    )
                    behaviour_count += 1

                    # Add flags for low ratings
                    if rating <= 2:
                        category = random.choice([
                            "talking", "phone", "late", "refused",
                            "disrespect", "incomplete",
                        ])
                        severity = "minor" if rating == 2 else random.choice(["moderate", "serious"])

                        BehaviourFlag.objects.create(
                            log=log,
                            category=category,
                            severity=severity,
                            notes=random.choice([
                                "Disrupting class repeatedly.",
                                "Using phone during lesson.",
                                "Arrived 15 minutes late.",
                                "Refused to complete classwork.",
                                "Talking over teacher.",
                                "Did not submit homework.",
                            ]),
                        )
                        flag_count += 1

                    # Add positive flags for high ratings
                    elif rating == 5:
                        BehaviourFlag.objects.create(
                            log=log,
                            category=random.choice(["participation", "leadership"]),
                            severity="minor",
                            notes=random.choice([
                                "Excellent class participation.",
                                "Helped struggling classmates.",
                                "Led group discussion effectively.",
                                "Volunteered to present to the class.",
                            ]),
                        )
                        flag_count += 1

        # Create a few escalations
        problem_learners = random.sample(all_learners.get("10A", []), min(3, len(all_learners.get("10A", []))))
        for learner in problem_learners:
            BehaviourEscalation.objects.create(
                learner=learner,
                level=random.choice([1, 2]),
            )

        self.stdout.write(self.style.SUCCESS(
            f"  Created {behaviour_count} behaviour logs, {flag_count} flags, "
            f"{len(problem_learners)} escalations"
        ))

        # ─── 15. REFLECTIONS & TO-DOS ────────────────────────────────────
        reflection_count = 0
        for plan in lesson_plans[:3]:
            ref = LessonReflection.objects.create(
                lesson_plan=plan,
                what_went_well=random.choice([
                    "Learners engaged well with the group activity. Most completed the worksheet.",
                    "The GeoGebra demo captured attention. Good questions from learners.",
                    "Pair work was effective. Stronger learners helped weaker ones.",
                ]),
                what_was_challenging=random.choice([
                    "Some learners struggled with the abstract concepts. Need more concrete examples.",
                    "Time management - didn't get to the last 2 examples.",
                    "A few learners were disruptive during independent work time.",
                ]),
                needs_revisiting=random.choice([
                    "Factorisation of trinomials - many learners confused about signs.",
                    "Plotting negative gradients - need to revisit next lesson.",
                    "",
                ]),
                do_differently=random.choice([
                    "Start with a real-world hook next time.",
                    "Prepare differentiated worksheets (3 levels).",
                    "Use mini whiteboards for formative checking.",
                ]),
                engagement_rating=random.randint(5, 9),
                created_by=plan.submitted_by,
            )
            reflection_count += 1

            # To-do tasks
            todos = [
                ("Print differentiated worksheets for next lesson", "resource", "high"),
                ("Follow up with Sipho about missed work", "learner", "medium"),
                ("Upload lesson resources to shared drive", "admin", "low"),
            ]
            for desc, task_type, priority in random.sample(todos, 2):
                ToDoTask.objects.create(
                    reflection=ref,
                    description=desc,
                    task_type=task_type,
                    priority=priority,
                    status="open",
                    created_by=plan.submitted_by,
                )

        self.stdout.write(self.style.SUCCESS(
            f"  Created {reflection_count} reflections with to-do tasks"
        ))

        # ─── 16. USER PREFERENCES ────────────────────────────────────────
        for user in User.objects.filter(school=school, role__in=["teacher", "hod", "grade_head", "deputy", "principal"]):
            UserPreference.objects.get_or_create(
                user=user,
                defaults={
                    "notification_email": True,
                    "notification_push": True,
                    "notification_sms": False,
                },
            )

        # ─── SUMMARY ────────────────────────────────────────────────────
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("  SEED DATA COMPLETE"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(f"  School:       {school.name}")
        self.stdout.write(f"  Staff:        {User.objects.filter(school=school).exclude(role__in=['learner', 'parent']).count()}")
        self.stdout.write(f"  Learners:     {User.objects.filter(school=school, role='learner').count()}")
        self.stdout.write(f"  Grades:       {Grade.objects.filter(school=school).count()}")
        self.stdout.write(f"  Subjects:     {Subject.objects.filter(school=school).count()}")
        self.stdout.write(f"  Classrooms:   {Classroom.objects.filter(school=school).count()}")
        self.stdout.write(f"  Timetable:    {TimetableSlot.objects.filter(timetable=timetable).count()} slots")
        self.stdout.write(f"  Attendance:   {attendance_count} records")
        self.stdout.write(f"  Lesson Plans: {plan_count}")
        self.stdout.write(f"  Assessments:  {len(assessments_created)} ({marks_count} marks)")
        self.stdout.write(f"  Behaviour:    {behaviour_count} logs, {flag_count} flags")
        self.stdout.write(f"  Reflections:  {reflection_count}")
        self.stdout.write("")
        self.stdout.write("  Login credentials:")
        self.stdout.write("  ─────────────────────────────────────────")
        self.stdout.write("  Principal:  principal.mokoena / EduAdmin2026!")
        self.stdout.write("  Deputy:     deputy.vanwyk    / EduAdmin2026!")
        self.stdout.write("  Admin:      admin.pillay     / EduAdmin2026!")
        self.stdout.write("  HOD (Math): hod.naidoo       / EduAdmin2026!")
        self.stdout.write("  Teacher:    t.williams       / EduAdmin2026!")
        self.stdout.write("  Learner:    (see database)   / Learner2026!")
        self.stdout.write("")
