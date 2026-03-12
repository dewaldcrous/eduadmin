import axios from "axios";

var API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

var client = axios.create({ baseURL: API_BASE });

client.interceptors.request.use(function(config) {
  var token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

client.interceptors.response.use(
  function(response) { return response; },
  async function(error) {
    var orig = error.config;
    if (error.response && error.response.status === 401 && !orig._retry) {
      orig._retry = true;
      var refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          var res = await axios.post(API_BASE + "/auth/refresh/", { refresh: refresh });
          localStorage.setItem("access_token", res.data.access);
          orig.headers.Authorization = "Bearer " + res.data.access;
          return client(orig);
        } catch (e) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export var login = async function(username, password) {
  var res = await axios.post(API_BASE + "/auth/login/", { username: username, password: password });
  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);
  return res.data;
};

export var logout = function() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export var getMe = function() { return client.get("/accounts/me/"); };

// ─── Staff Management (Faculty Only) ─────────────────────
export var getStaff = function() { return client.get("/accounts/staff/"); };
export var createStaff = function(data) { return client.post("/accounts/staff/", data); };
export var updateStaff = function(id, data) { return client.put("/accounts/staff/" + id + "/", data); };
export var toggleStaffStatus = function(id, isActive) { return client.patch("/accounts/staff/" + id + "/", { is_active: isActive }); };

// ─── Schools & Timetable ──────────────────────────────────
export var getSchools = function() { return client.get("/schools/"); };
export var getMySlots = function() { return client.get("/schools/my-slots/"); };

// Timetable management
export var getTimetables = function() { return client.get("/schools/timetables/"); };
export var createTimetable = function(data) { return client.post("/schools/timetables/", data); };
export var getTimetableDetail = function(id) { return client.get("/schools/timetables/" + id + "/"); };
export var updateTimetableStatus = function(id, status) { return client.patch("/schools/timetables/" + id + "/", { status: status }); };
export var deleteTimetable = function(id) { return client.delete("/schools/timetables/" + id + "/"); };

// Timetable slots
export var createTimetableSlot = function(timetableId, data) { return client.post("/schools/timetables/" + timetableId + "/slots/", data); };
export var updateTimetableSlot = function(timetableId, slotId, data) { return client.put("/schools/timetables/" + timetableId + "/slots/" + slotId + "/", data); };
export var deleteTimetableSlot = function(timetableId, slotId) { return client.delete("/schools/timetables/" + timetableId + "/slots/" + slotId + "/"); };

// Reference data
export var getTeachers = function() { return client.get("/schools/teachers/"); };
export var getClassrooms = function() { return client.get("/schools/classrooms/"); };
export var getSubjects = function() { return client.get("/schools/subjects/"); };
export var getGrades = function() { return client.get("/schools/grades/"); };

// Timetable configuration (periods, cycle days)
export var getTimetableConfig = function(id) { return client.get("/schools/timetables/" + id + "/config/"); };
export var updateTimetableConfig = function(id, data) { return client.put("/schools/timetables/" + id + "/config/", data); };

// Class/Subject/Grade management
export var createSubject = function(data) { return client.post("/schools/subjects/", data); };
export var updateSubject = function(id, data) { return client.put("/schools/subjects/" + id + "/", data); };
export var deleteSubject = function(id) { return client.delete("/schools/subjects/" + id + "/"); };
export var createGrade = function(data) { return client.post("/schools/grades/create/", data); };
export var updateGrade = function(id, data) { return client.put("/schools/grades/" + id + "/", data); };
export var deleteGrade = function(id) { return client.delete("/schools/grades/" + id + "/"); };
export var createClassroom = function(data) { return client.post("/schools/classrooms/create/", data); };
export var updateClassroom = function(id, data) { return client.put("/schools/classrooms/" + id + "/", data); };
export var deleteClassroom = function(id) { return client.delete("/schools/classrooms/" + id + "/"); };

// ─── Attendance ───────────────────────────────────────────
export var getAttendance = function(slotId, date) {
  return client.get("/learners/attendance/?slot=" + slotId + "&date=" + date);
};
export var saveAttendance = function(data) {
  return client.post("/learners/attendance/", data);
};

// ─── Learners ─────────────────────────────────────────────
export var getLearners = function(params) {
  var query = [];
  if (params) {
    if (params.classroom) query.push("classroom=" + params.classroom);
    if (params.grade) query.push("grade=" + params.grade);
    if (params.search) query.push("search=" + encodeURIComponent(params.search));
  }
  return client.get("/learners/" + (query.length ? "?" + query.join("&") : ""));
};
export var getLearnerDetail = function(id) { return client.get("/learners/" + id + "/"); };
export var getClassRoster = function(classroomId) { return client.get("/learners/classroom/" + classroomId + "/roster/"); };
export var getLearnerAttendance = function(learnerId, from, to) {
  var q = [];
  if (from) q.push("from=" + from);
  if (to) q.push("to=" + to);
  return client.get("/learners/" + learnerId + "/attendance/" + (q.length ? "?" + q.join("&") : ""));
};
export var getLearnerSupportPlans = function(learnerId) { return client.get("/learners/" + learnerId + "/support-plans/"); };
export var createSupportPlan = function(learnerId, data) { return client.post("/learners/" + learnerId + "/support-plans/", data); };

// Learner Management
export var createLearner = function(data) { return client.post("/learners/create/", data); };
export var bulkImportLearners = function(file) {
  var fd = new FormData();
  fd.append("file", file);
  return client.post("/learners/bulk-import/", fd);
};
export var enrollLearner = function(learnerId, classroomId) {
  return client.post("/learners/" + learnerId + "/enroll/", { classroom_id: classroomId });
};
export var unenrollLearner = function(learnerId, classroomId) {
  return client.delete("/learners/" + learnerId + "/enroll/", { data: { classroom_id: classroomId } });
};

// ─── Planning ─────────────────────────────────────────────
export var getPlans = function(params) {
  var query = [];
  if (params) {
    if (params.slot) query.push("slot=" + params.slot);
    if (params.status) query.push("status=" + params.status);
  }
  return client.get("/planning/" + (query.length ? "?" + query.join("&") : ""));
};
export var getPlanDetail = function(id) { return client.get("/planning/" + id + "/"); };
export var createPlan = function(data) { return client.post("/planning/", data); };
export var updatePlan = function(id, data) { return client.put("/planning/" + id + "/", data); };
export var deletePlan = function(id) { return client.delete("/planning/" + id + "/"); };
export var getWeeklyPlan = function(teacherId) {
  return client.get("/planning/weekly/" + (teacherId ? "?teacher=" + teacherId : ""));
};
export var submitPlan = function(planId) { return client.post("/planning/submit/", { plan_id: planId }); };
export var approvePlan = function(planId, action, feedback) {
  return client.post("/planning/approve/", { plan_id: planId, action: action, feedback: feedback || "" });
};
export var deliverLesson = function(planId, completion, coveragePercent) {
  return client.post("/planning/deliver/", { plan_id: planId, completion: completion, coverage_percent: coveragePercent });
};
export var getPendingApprovals = function() { return client.get("/planning/pending/"); };
export var importPlans = function(file) {
  var fd = new FormData();
  fd.append("file", file);
  return client.post("/planning/import/", fd);
};
export var exportPlansUrl = function(format) { return API_BASE + "/planning/export/?format=" + (format || "csv"); };

// ─── Attachments ──────────────────────────────────────────
export var uploadAttachments = function(planId, files, description) {
  var fd = new FormData();
  files.forEach(function(f) { fd.append("files", f); });
  if (description) fd.append("description", description);
  return client.post("/planning/" + planId + "/attachments/", fd);
};
export var getAttachments = function(planId) { return client.get("/planning/" + planId + "/attachments/list/"); };
export var deleteAttachment = function(attId) { return client.delete("/planning/attachments/" + attId + "/delete/"); };

// ─── Behaviour ────────────────────────────────────────────
export var getBehaviourLogs = function(params) {
  var query = [];
  if (params) {
    if (params.learner) query.push("learner=" + params.learner);
    if (params.slot) query.push("slot=" + params.slot);
    if (params.date) query.push("date=" + params.date);
  }
  return client.get("/behaviour/" + (query.length ? "?" + query.join("&") : ""));
};

// ─── Assessments ──────────────────────────────────────────
export var getAssessments = function(params) {
  var query = [];
  if (params) {
    if (params.subject) query.push("subject=" + params.subject);
    if (params.grade) query.push("grade=" + params.grade);
  }
  return client.get("/assessments/" + (query.length ? "?" + query.join("&") : ""));
};

// ─── Analytics ────────────────────────────────────────────
export var getRiskScores = function(classroomId) {
  return client.get("/analytics/risk-scores/" + (classroomId ? "?classroom=" + classroomId : ""));
};

export default client;
