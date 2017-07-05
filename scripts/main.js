// Firebase config
var config = {
  apiKey: "AIzaSyBE5MOWlHjCG1uifUhViweuKo4pbn3RceY",
  authDomain: "igda-survey-arcade.firebaseapp.com",
  databaseURL: "https://igda-survey-arcade.firebaseio.com",
  projectId: "igda-survey-arcade"
};

var surveys = {};

var activeSurveyIndex = 0;
var activeQuestionIndex = 0;
var activeButtons = [];

var buttonCount = 4;

var online = false;
var runningSurvey = false;

var hideCursorDelay = 10;
var hideCursorTimeout = null;

var resetSurveyDelay = 60;
var resetSurveyTimeout = null;

var defaultWelcomeMessage = "Take a moment to answer some questions for us? Hit any button to continue.";
var defaultEndMessage = "Thank you for answering some questions! Hit any button to restart.";

document.getElementById("status").innerHTML = "starting up...";

function init()
{
  online = navigator.onLine;

  if (online)
  {
    document.getElementById("status").innerHTML = "online";
    console.log("online");

    // Initialize Firebase
    firebase.initializeApp(config);

    // Authenticate user
    firebase.auth().signInWithEmailAndPassword("igda@survey.cabinet", "videogames").catch(function(error) {
      console.log(error.code);
      console.log(error.message);
    });

    if (window.localStorage.getItem("syncRequired") == "true")
    {
      console.log("syncing");
    }

    // Read survey data
    firebase.database().ref("surveys").once("value").then(function(data) {
      surveys = data.val();

      if (surveys == null)
      {
        surveys = {};
      }

      if (window.localStorage.getItem("surveys") == "" || isJsonString(window.localStorage.getItem("surveys")) == false)
      {
        storeSurveysOffline();
      }

      displaySurveys();
    });
  }
  else
  {
    document.getElementById("status").innerHTML = "offline";
    console.log("offline");
    window.localStorage.setItem("syncRequired", "true");

    if (isJsonString(window.localStorage.getItem("surveys")))
    {
      surveys = JSON.parse(window.localStorage.getItem("surveys"));
      alert("Loaded from local storage, go online to sync.");
    }
    else
    {
      alert("Error when reading from local storage.");
    }

    displaySurveys();
  }

  if (window.addEventListener)
  {
    window.addEventListener("online", goOnline, false);
    window.addEventListener("offline", goOffline, false);
    window.addEventListener("keydown", handleKeyDown, false);
    window.addEventListener("keyup", handleKeyUp, false);
    window.addEventListener("mousemove", handleMouseMove, false);
  }
  else
  {
    document.body.ononline = goOnline;
    document.body.onoffline = goOffline;
    document.body.keydown = handleKeyDown;
    document.body.keyup = handleKeyUp;
    document.body.mousemove = handleMouseMove;
  }
}

function isJsonString(str)
{
    try
    {
        JSON.parse(str);
    }
    catch (e)
    {
        return false;
    }

    return true;
}

function makeElement(parent, type, content, name, suffix)
{
  var newElement = document.createElement(type);

  newElement.id = name + suffix;
  newElement.className = name;
  newElement.innerHTML = content;
  newElement.value = content;

  parent.appendChild(newElement);

  return newElement;
}

function getSurveyCount()
{
  return Object.keys(surveys).length;
}

function getQuestionCount(surveyIndex)
{
  return Object.keys(surveys["survey" + surveyIndex.toString()].questions).length;
}

function getAnswerCount(surveyIndex, questionIndex)
{
  return Object.keys(surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers).length;
}

function getSurveyName(surveyIndex)
{
  return surveys["survey" + surveyIndex.toString()].surveyName;
}

function getQuestionName(surveyIndex, questionIndex)
{
  return surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].questionName;
}

function getAnswerName(surveyIndex, questionIndex, answerIndex)
{
  return surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()].answerName;
}

function getSurvey(surveyIndex)
{
  return surveys["survey" + surveyIndex.toString()];
}

function getSurveys()
{
  return surveys;
}

function getQuestions(surveyIndex)
{
  return surveys["survey" + surveyIndex.toString()].questions;
}

function getAnswers(surveyIndex, questionIndex)
{
  return surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers;
}

function getAnswerResponses(surveyIndex, questionIndex, answerIndex)
{
  return surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()].responses;
}

function displaySurveys()
{
  var editorPanel = document.getElementById("editorPanel");

  editorPanel.innerHTML = "";

  document.body.style.cursor = "default";

  if (resetSurveyTimeout != null)
  {
    clearTimeout(resetSurveyTimeout);
    resetSurveyTimeout = null;
  }

  if (hideCursorTimeout != null)
  {
    clearTimeout(hideCursorTimeout);
    hideCursorTimeout = null;
  }

  var surveyPanel = makeElement(editorPanel, "div", "", "surveyPanel", "");

  for (var surveyIndex = 0; surveyIndex < getSurveyCount(); surveyIndex++)
  {
    var surveyRow = makeElement(surveyPanel, "div", "", "surveyRow", surveyIndex.toString());

    var surveyTitle = makeElement(surveyRow, "div", getSurveyName(surveyIndex), "surveyTitle", surveyIndex.toString());

    var surveyEditButton = makeElement(surveyRow, "button", "edit survey", "surveyEditButton", surveyIndex.toString());
    surveyEditButton.setAttribute("onclick", "editSurvey(" + surveyIndex.toString() + ")");

    var surveyDuplicateButton = makeElement(surveyRow, "button", "duplicate survey", "surveyDuplicateButton", surveyIndex.toString());
    surveyDuplicateButton.setAttribute("onclick", "duplicateSurvey(" + surveyIndex.toString() + ")");

    var surveyRemoveButton = makeElement(surveyRow, "button", "remove survey", "surveyRemoveButton", surveyIndex.toString());
    surveyRemoveButton.setAttribute("onclick", "removeSurvey(" + surveyIndex.toString() + ")");

    var surveyRunButton = makeElement(surveyRow, "button", "run survey", "surveyRunButton", surveyIndex.toString());
    surveyRunButton.setAttribute("onclick", "runSurvey(" + surveyIndex.toString() + ")");

    var surveyResultsButton = makeElement(surveyRow, "button", "view results", "surveyResultsButton", surveyIndex.toString());
    surveyResultsButton.setAttribute("onclick", "viewSurveyResults(" + surveyIndex.toString() + ")");
  }

  makeElement(editorPanel, "hr", "", "break", "");

  var addSurveyButton = makeElement(editorPanel, "button", "add survey", "addSurveyButton", "");
  addSurveyButton.setAttribute("onclick", "addSurvey()");

  var saveSurveysButton = makeElement(editorPanel, "button", "save changes", "saveSurveysButton", "");
  saveSurveysButton.setAttribute("onclick", "saveAll()");
}

function editSurvey(surveyIndex)
{
  activeSurveyIndex = surveyIndex;

  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  makeElement(editorPanel, "div", "Survey Name:", "", "");
  var surveyHeader = makeElement(editorPanel, "input", getSurveyName(surveyIndex), "surveyHeader", surveyIndex.toString());
  surveyHeader.setAttribute("onchange", "setSurveyName('" + surveyHeader.id + "', " + surveyIndex.toString() + ")");
  surveyHeader.focus();
  surveyHeader.select();

  makeElement(editorPanel, "div", "Show Welcome Message?:", "surveyWelcomeMessageLabel", surveyIndex.toString());
  var surveyShowWelcomeMessage = makeElement(editorPanel, "input", "", "surveyShowWelcomeMessage", surveyIndex.toString());
  surveyShowWelcomeMessage.setAttribute("type", "checkbox");
  surveyShowWelcomeMessage.checked = getSurvey(surveyIndex).showWelcomeMessage;
  surveyShowWelcomeMessage.setAttribute("onchange", "setShowWelcomeMessage('" + surveyShowWelcomeMessage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Welcome Message:", "surveyWelcomeMessageLabel", surveyIndex.toString());
  var surveyWelcomeMessage = makeElement(editorPanel, "input", getSurvey(surveyIndex).welcomeMessage, "surveyWelcomeMessage", surveyIndex.toString());
  surveyWelcomeMessage.setAttribute("onchange", "setSurveyWelcomeMessage('" + surveyWelcomeMessage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "End Message:", "surveyWelcomeMessageLabel", surveyIndex.toString());
  var surveyEndMessage = makeElement(editorPanel, "input", getSurvey(surveyIndex).endMessage, "surveyEndMessage", surveyIndex.toString());
  surveyEndMessage.setAttribute("onchange", "setSurveyEndMessage('" + surveyEndMessage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "hr", "", "break", "");

  makeElement(editorPanel, "div", "Questions:", "", "");
  var questionPanel = makeElement(editorPanel, "div", "", "questionPanel", "")

  for (var questionIndex = 0; questionIndex < getQuestionCount(surveyIndex); questionIndex++)
  {
    var questionRow = makeElement(questionPanel, "div", "", "questionRow", questionIndex.toString());

    var questionTitle = makeElement(questionRow, "div", getQuestionName(surveyIndex, questionIndex), "questionTitle", questionIndex.toString());

    var questionEditButton = makeElement(questionRow, "button", "edit question", "questionEditButton", questionIndex.toString());
    questionEditButton.setAttribute("onclick", "editQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    var questionDuplicateButton = makeElement(questionRow, "button", "duplicate question", "questionDuplicateButton", questionIndex.toString());
    questionDuplicateButton.setAttribute("onclick", "duplicateQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    var questionRemoveButton = makeElement(questionRow, "button", "remove question", "questionRemoveButton", questionIndex.toString());
    questionRemoveButton.setAttribute("onclick", "removeQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    var questionShiftUpButton = makeElement(questionRow, "button", "shift up", "questionShiftUpButton", questionIndex.toString());
    questionShiftUpButton.setAttribute("onclick", "shiftQuestionUp(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    var questionShiftDownButton = makeElement(questionRow, "button", "shift down", "questionShiftDownButton", questionIndex.toString());
    questionShiftDownButton.setAttribute("onclick", "shiftQuestionDown(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");
  }

  makeElement(editorPanel, "hr", "", "break", "");

  var addQuestionButton = makeElement(editorPanel, "button", "add question", "addQuestionButton", "");
  addQuestionButton.setAttribute("onclick", "addQuestion(" + surveyIndex.toString() + ")");

  var surveySaveButton = makeElement(editorPanel, "button", "save survey", "surveySaveButton", surveyIndex.toString());
  surveySaveButton.setAttribute("onclick", "saveSurvey(" + surveyIndex.toString() + ")");
}

function editQuestion(surveyIndex, questionIndex, highlightIndex)
{
    activeQuestionIndex = questionIndex;

    var editorPanel = document.getElementById("editorPanel");

    editorPanel.innerHTML = "";

    makeElement(editorPanel, "div", "Question Name:", "", "");
    var questionHeader = makeElement(editorPanel, "input", getQuestionName(surveyIndex, questionIndex), "questionHeader", questionIndex.toString());
    questionHeader.setAttribute("onchange", "setQuestionName('" + questionHeader.id + "', " + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    if (highlightIndex == undefined)
    {
      questionHeader.focus();
      questionHeader.select();
    }

    makeElement(editorPanel, "div", "Answers (number of responses):", "", "");
    var answerPanel = makeElement(editorPanel, "div", "", "answerPanel", "")

    for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, questionIndex); answerIndex++)
    {
      var answerRow = makeElement(answerPanel, "div", "", "answerRow", answerIndex.toString());

      var answerTitle = makeElement(answerRow, "input", getAnswerName(surveyIndex, questionIndex, answerIndex), "answerTitle", answerIndex.toString());
      answerTitle.setAttribute("onchange", "setAnswerName('" + answerTitle.id.toString() + "', " + surveyIndex.toString() + ", " + questionIndex.toString() + ", " + answerIndex.toString() + ")");

      var answerResponses = makeElement(answerRow, "span", "(" + getAnswerResponses(surveyIndex, questionIndex, answerIndex) + ")", "answerResponses", answerIndex.toString());

      var answerRemoveButton = makeElement(answerRow, "button", "remove answer", "answerRemoveButton", answerIndex.toString());
      answerRemoveButton.setAttribute("onclick", "removeAnswer(" + surveyIndex.toString() + ", " + questionIndex.toString() + ", " + answerIndex.toString() + ")");

      var answerShiftUpButton = makeElement(answerRow, "button", "shift up", "answerShiftUpButton", answerIndex.toString());
      answerShiftUpButton.setAttribute("onclick", "shiftAnswerUp(" + surveyIndex.toString() + ", " + questionIndex.toString() + ", " + answerIndex.toString() + ")");

      var answerShiftDownButton = makeElement(answerRow, "button", "shift down", "answerShiftDownButton", answerIndex.toString());
      answerShiftDownButton.setAttribute("onclick", "shiftAnswerDown(" + surveyIndex.toString() + ", " + questionIndex.toString() + ", " + answerIndex.toString() + ")");

      if (highlightIndex == answerIndex)
      {
        answerTitle.focus();
        answerTitle.select();
      }
    }

    makeElement(editorPanel, "hr", "", "break", "");

    var addAnswerButton = makeElement(editorPanel, "button", "add answer", "addAnswerButton", "");
    addAnswerButton.setAttribute("onclick", "addAnswer(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    var questionSaveButton = makeElement(editorPanel, "button", "save question", "questionSaveButton", questionIndex.toString());
    questionSaveButton.setAttribute("onclick", "saveQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");
}

function setSurveyName(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].surveyName = document.getElementById(elementId).value;
}

function setShowWelcomeMessage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].showWelcomeMessage = document.getElementById(elementId).checked;
}

function setSurveyWelcomeMessage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].welcomeMessage = document.getElementById(elementId).value;
}

function setSurveyEndMessage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].endMessage = document.getElementById(elementId).value;
}

function setQuestionName(elementId, surveyIndex, questionIndex)
{
  surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].questionName = document.getElementById(elementId).value;
}

function setAnswerName(elementId, surveyIndex, questionIndex, answerIndex)
{
  surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()].answerName = document.getElementById(elementId).value;
}

function addSurvey()
{
  surveys["survey" + getSurveyCount().toString()] = { "surveyName":"new survey", "welcomeMessage":defaultWelcomeMessage, "endMessage":defaultEndMessage, "showWelcomeMessage":false, "questions": {"question0":{"questionName":"new question", "answers":{"answer0":{"answerName":"new answer", "responses":0}}}}};

  displaySurveys();
}

function duplicateSurvey(surveyIndex)
{
  var newSurveyIndex = getSurveyCount();
  surveys["survey" + newSurveyIndex.toString()] = $.extend(true, {}, surveys["survey" + surveyIndex.toString()]);

  for (var questionIndex = 0; questionIndex < getQuestionCount(newSurveyIndex); questionIndex++)
  {
    for (var answerIndex = 0; answerIndex < getAnswerCount(newSurveyIndex, questionIndex); answerIndex++)
    {
      surveys["survey" + newSurveyIndex.toString()].questions["question" + questionIndex].answers["answer" + answerIndex].responses = 0;
    }
  }

  displaySurveys();
}

function addQuestion(surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].questions["question" + getQuestionCount(surveyIndex).toString()] = { "questionName":"new question", "answers":{"answer0":{"answerName":"new answer", "responses":0}}};

  editSurvey(surveyIndex);
}

function duplicateQuestion(surveyIndex, questionIndex)
{
  var newQuestionIndex = getQuestionCount(surveyIndex);
  surveys["survey" + surveyIndex.toString()].questions["question" + newQuestionIndex] = $.extend(true, {}, surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()]);

  for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, newQuestionIndex); answerIndex++)
  {
    surveys["survey" + surveyIndex.toString()].questions["question" + newQuestionIndex].answers["answer" + answerIndex].responses = 0;
  }

  editSurvey(surveyIndex);
}

function shiftQuestionUp(surveyIndex, questionIndex)
{
  if (questionIndex > 0)
  {
    var questionContent = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()] = surveys["survey" + surveyIndex.toString()].questions["question" + (questionIndex - 1).toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + (questionIndex - 1).toString()] = questionContent;

    editSurvey(surveyIndex);
  }
}

function shiftQuestionDown(surveyIndex, questionIndex)
{
  if (questionIndex < getQuestionCount(surveyIndex) - 1)
  {
    var questionContent = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()] = surveys["survey" + surveyIndex.toString()].questions["question" + (questionIndex + 1).toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + (questionIndex + 1).toString()] = questionContent;

    editSurvey(surveyIndex);
  }
}

function shiftAnswerUp(surveyIndex, questionIndex, answerIndex)
{
  if (answerIndex > 0)
  {
    var answerContent = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()] = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + (answerIndex - 1).toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + (answerIndex - 1).toString()] = answerContent;

    editQuestion(surveyIndex, questionIndex);
  }
}

function shiftAnswerDown(surveyIndex, questionIndex, answerIndex)
{
  if (answerIndex < getAnswerCount(surveyIndex, questionIndex) - 1)
  {
    var answerContent = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + answerIndex.toString()] = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + (answerIndex + 1).toString()];
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + (answerIndex + 1).toString()] = answerContent;

    editQuestion(surveyIndex, questionIndex);
  }
}

function addAnswer(surveyIndex, questionIndex)
{
  var newAnswerIndex = getAnswerCount(surveyIndex, questionIndex);

  if (newAnswerIndex < buttonCount)
  {
    surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + newAnswerIndex.toString()] = { "answerName":"new answer", "responses":0 };

    editQuestion(surveyIndex, questionIndex, newAnswerIndex);
  }
  else
  {
    alert("You cannot have more answers than buttons!");
  }
}

function removeSurvey(surveyIndex)
{
  if (getSurveyCount() <= 1)
  {
    alert("You cannot remove the last survey!");
  }
  else if (confirm("Are you sure you wish to remove this survey? The action cannot be undone and will delete the associated data."))
  {
    for (var otherSurveyIndex = surveyIndex; otherSurveyIndex < getSurveyCount() - 1; otherSurveyIndex++)
    {
      surveys["survey" + otherSurveyIndex.toString()] = surveys["survey" + (otherSurveyIndex + 1).toString()];
    }

    delete surveys["survey" + (getSurveyCount() - 1).toString()];
  }

  displaySurveys();
}

function removeQuestion(surveyIndex, questionIndex)
{
  if (getQuestionCount(surveyIndex) <= 1)
  {
    alert("You cannot remove the last question!");
  }
  else if (confirm("Are you sure you wish to remove this question? The action cannot be undone and will delete the associated data."))
  {
    for (var otherQuestionIndex = questionIndex; otherQuestionIndex < getQuestionCount(surveyIndex) - 1; otherQuestionIndex++)
    {
      surveys["survey" + surveyIndex.toString()].questions["question" + otherQuestionIndex.toString()] = surveys["survey" + surveyIndex.toString()].questions["question" + (otherQuestionIndex + 1).toString()];
    }

    delete surveys["survey" + surveyIndex.toString()].questions["question" + (getQuestionCount(surveyIndex) - 1).toString()];
  }

  editSurvey(surveyIndex);
}

function removeAnswer(surveyIndex, questionIndex, answerIndex)
{
  if (getAnswerCount(surveyIndex, questionIndex) <= 1)
  {
    alert("You cannot remove the last answer!");
  }
  else if (confirm("Are you sure you wish to remove this answer? The action cannot be undone and will delete the associated data."))
  {
    for (var otherAnswerIndex = answerIndex; otherAnswerIndex < getAnswerCount(surveyIndex, questionIndex) - 1; otherAnswerIndex++)
    {
      surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + otherAnswerIndex.toString()] = surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + (otherAnswerIndex + 1).toString()];
    }

    delete surveys["survey" + surveyIndex.toString()].questions["question" + questionIndex.toString()].answers["answer" + (getAnswerCount(surveyIndex, questionIndex) - 1).toString()];
  }

  editQuestion(surveyIndex, questionIndex);
}

function saveAll()
{
  syncSurvey(-1, -1);

  displaySurveys();
}

function saveSurvey(surveyIndex)
{
  syncSurvey(surveyIndex, -1);

  displaySurveys();
}

function saveQuestion(surveyIndex, questionIndex)
{
  syncSurvey(surveyIndex, questionIndex);

  editSurvey(surveyIndex);
}

function syncSurvey(surveyIndex, questionIndex)
{
  if (online)
  {
    if (surveyIndex == -1)
    {
      storeAllOnline();
    }
    else if (questionIndex == -1)
    {
      storeSurveyOnline(surveyIndex);
    }
    else
    {
      storeQuestionOnline(surveyIndex, questionIndex);
    }
  }
  else
  {
    window.localStorage.setItem("syncRequired", "true");
    storeSurveysOffline();
    alert("Not connected to database, syncing offline. Connect later to sync online.");
  }
}

function syncLocalSurveys()
{
  if (isJsonString(window.localStorage.getItem("surveys")))
  {
    firebase.database().ref('surveys').set(JSON.parse(window.localStorage.getItem("surveys")));
    alert("Successfuly synced from local storage.");
  }
  else
  {
    alert("Error when reading from local storage during sync.");
  }

  window.localStorage.setItem("syncRequired", "false");
}

function storeAllOnline()
{
  firebase.database().ref('surveys').set(getSurveys());
}

function storeSurveyOnline(surveyIndex)
{
  firebase.database().ref('surveys/survey' + surveyIndex.toString()).set(getSurveys()["survey" + surveyIndex.toString()]);
}

function storeQuestionOnline(surveyIndex, questionIndex)
{
  firebase.database().ref('surveys/survey' + surveyIndex.toString() + "/questions/question" + questionIndex.toString()).set(getQuestions(surveyIndex)["question" + questionIndex.toString()]);
}

function storeSurveysOffline()
{
  if (surveys != undefined)
  {
    window.localStorage.setItem("surveys", JSON.stringify(surveys));
  }
}

function goOnline()
{
  if (online == false)
  {
    online = true;

    if (window.localStorage.getItem("syncRequired") == "true")
    {
      syncLocalSurveys();
    }
  }
}

function goOffline()
{
  if (online == true)
  {
    online = false;
  }
}

function runSurvey(surveyIndex)
{
  launchIntoFullscreen(document.documentElement);

  runningSurvey = true;

  document.getElementById("header").style.visibility = "hidden";

  activeSurveyIndex = surveyIndex;
  activeQuestionIndex = 0;

  restartSurveyTimeout();
  restartCursorTimeout();

  if (getSurvey(activeSurveyIndex).showWelcomeMessage == true)
  {
    displayWelcomeMessage();
  }
  else
  {
    displayActiveQuestion();
  }
}

function hideCursor()
{
  document.body.style.cursor = "none";
}

function restartSurvey()
{
  syncSurvey(activeSurveyIndex, -1);

  runSurvey(activeSurveyIndex);
}

function restartSurveyTimeout()
{
  if (resetSurveyTimeout != null)
  {
    clearTimeout(resetSurveyTimeout);
  }

  resetSurveyTimeout = setTimeout(restartSurvey, resetSurveyDelay * 1000);
}

function restartCursorTimeout()
{
  if (hideCursorTimeout != null)
  {
    clearTimeout(hideCursorTimeout);
  }

  hideCursorTimeout = setTimeout(hideCursor, hideCursorDelay * 1000);
}

function displayActiveQuestion()
{
  var surveyIndex = activeSurveyIndex;
  var questionIndex = activeQuestionIndex;

  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  var questionHeader = makeElement(editorPanel, "div", getQuestionName(surveyIndex, questionIndex), "activeQuestionHeader", questionIndex.toString());

  var answerPanel = makeElement(editorPanel, "div", "", "answerPanel", "")

  activeButtons = [];

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var answerSelectButton;

    if (buttonIndex < getAnswerCount(surveyIndex, questionIndex))
    {
      answerSelectButton = makeElement(editorPanel, "button", getAnswerName(surveyIndex, questionIndex, buttonIndex), "answerSelectButton", buttonIndex.toString());
      answerSelectButton.setAttribute("onclick", "saveResponse(" + buttonIndex.toString() + ")");
    }
    else
    {
      answerSelectButton = makeElement(editorPanel, "button", "", "inactiveAnswerSelectButton", buttonIndex.toString());
    }

    activeButtons.push(answerSelectButton);
  }
}

function saveResponse(answerIndex)
{
  surveys["survey" + activeSurveyIndex.toString()].questions["question" + activeQuestionIndex.toString()].answers["answer" + answerIndex.toString()].responses += 1;

  displayNextQuestion();
}

function displayNextQuestion()
{
  activeQuestionIndex += 1;

  if (activeQuestionIndex >= getQuestionCount(activeSurveyIndex))
  {
    displayEndMessage();
  }
  else
  {
    displayActiveQuestion();
  }
}

function displayWelcomeMessage()
{
  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  var welcomeMessage = makeElement(editorPanel, "div", getSurvey(activeSurveyIndex).welcomeMessage, "welcomeMessage", "")

  var answerPanel = makeElement(editorPanel, "div", "", "answerPanel", "")

  activeButtons = [];

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var answerSelectButton;

    answerSelectButton = makeElement(editorPanel, "button", "", "inactiveAnswerSelectButton", buttonIndex.toString());
    answerSelectButton.setAttribute("onclick", "displayActiveQuestion()");

    activeButtons.push(answerSelectButton);
  }
}

function displayEndMessage()
{
  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  var endMessage = makeElement(editorPanel, "div", getSurvey(activeSurveyIndex).endMessage, "endMessage", "")

  var answerPanel = makeElement(editorPanel, "div", "", "answerPanel", "")

  activeButtons = [];

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var answerSelectButton;

    answerSelectButton = makeElement(editorPanel, "button", "", "inactiveAnswerSelectButton", buttonIndex.toString());
    answerSelectButton.setAttribute("onclick", "restartSurvey()");

    activeButtons.push(answerSelectButton);
  }
}

function exitSurvey()
{
  runningSurvey = false;

  document.getElementById("header").style.visibility = "visible";

  displaySurveys();
}

function viewSurveyResults(surveyIndex)
{
  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  var surveyHeader = makeElement(editorPanel, "div", getSurveyName(surveyIndex), "surveyResultsHeader", surveyIndex.toString());

  var questionPanel = makeElement(editorPanel, "div", "", "questionPanel", "")

  for (var questionIndex = 0; questionIndex < getQuestionCount(surveyIndex); questionIndex++)
  {
    var questionRow = makeElement(questionPanel, "div", "", "questionRow", questionIndex.toString());

    var questionTitle = makeElement(questionRow, "div", getQuestionName(surveyIndex, questionIndex), "questionTitle", questionIndex.toString());

    makeElement(questionPanel, "hr", "", "break", "");

    var answerPanel = makeElement(questionRow, "div", "", "answerPanel", questionIndex.toString())

    for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, questionIndex); answerIndex++)
    {
      var answerRow = makeElement(answerPanel, "div", "", "answerRow", answerIndex.toString());

      var answerTitle = makeElement(answerRow, "span", getAnswerName(surveyIndex, questionIndex, answerIndex), "answerTitle", answerIndex.toString());

      var answerResponses = makeElement(answerRow, "span", getAnswerResponses(surveyIndex, questionIndex, answerIndex), "answerResponses", answerIndex.toString());
    }
  }

  makeElement(editorPanel, "hr", "", "break", "");

  var backButton = makeElement(editorPanel, "button", "back", "backButton", surveyIndex.toString());
  backButton.setAttribute("onclick", "displaySurveys()");
}

function handleKeyDown(event)
{
  if (event.defaultPrevented)
  {
    return;
  }

  if (resetSurveyTimeout != null)
  {
    restartSurveyTimeout();
  }

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    if (event.keyCode == 49 + buttonIndex)
    {
      if (runningSurvey)
      {
        $(activeButtons[buttonIndex]).addClass("active");
      }
    }
  }

  switch (event.keyCode)
  {
    case 27:     exitSurvey();
      break;
    default:
      return;
  }

  event.preventDefault();
}

function handleKeyUp(event)
{
  if (event.defaultPrevented)
  {
    return;
  }

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    if (event.keyCode == 49 + buttonIndex)
    {
      if (runningSurvey)
      {
        $(activeButtons[buttonIndex]).click();
        $(activeButtons[buttonIndex]).removeClass("active");
      }
    }
  }

  event.preventDefault();
}

function output(msg)
{
  console.log(msg);
}

function handleMouseMove()
{
  document.body.style.cursor = "default";

  if (hideCursorTimeout != null)
  {
    restartCursorTimeout();
  }

  if (resetSurveyTimeout != null)
  {
    restartSurveyTimeout();
  }
}

function launchIntoFullscreen(element)
{
  if (element.requestFullscreen)
  {
    element.requestFullscreen();
  }
  else if (element.mozRequestFullScreen)
  {
    element.mozRequestFullScreen();
  }
  else if (element.webkitRequestFullscreen)
  {
    element.webkitRequestFullscreen();
  }
  else if (element.msRequestFullscreen)
  {
    element.msRequestFullscreen();
  }
}
