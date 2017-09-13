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
var defaultButtonColours = ["fbb14b", "527db5", "734f8d", "61bf91"];
var buttonColours = ["fbb14b", "527db5", "734f8d", "61bf91"];

var online = false;
var runningSurvey = false;
var displayingWelcomeMessage = false;
var displayingEndMessage = false;

var hideCursorDelay = 5;
var hideCursorTimeout = null;

var resetSurveyDelay = 60;
var resetSurveyTimeout = null;

var defaultWelcomeMessage = "Take a moment to answer some questions for us? Hit any button to continue.";
var defaultEndMessage = "Thank you for answering some questions! Hit any button to restart.";
var defaultContinueMessage = "Press a button!";

var transitionTime = 0.5 * 1000;
var buttonShrinkTime = 0.4 * 1000;

var pressSound;

var game = false;
var industry = 0.0;
var timer = 0.0;

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
      syncLocalSurveys();
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

  pressSound = new Howl({ src: ["sounds/press.mp3"] });
  setInterval(update, 10);

  if (window.addEventListener)
  {
    window.addEventListener("online", goOnline, false);
    window.addEventListener("offline", goOffline, false);
    window.addEventListener("keydown", handleKeyDown, false);
    window.addEventListener("keyup", handleKeyUp, false);
    window.addEventListener("mousedown", handleMouseDown, false);
    window.addEventListener("mousemove", handleMouseMove, false);
  }
  else
  {
    document.body.ononline = goOnline;
    document.body.onoffline = goOffline;
    document.body.keydown = handleKeyDown;
    document.body.keyup = handleKeyUp;
    document.body.mousedown = handleMouseDown;
    document.body.mousemove = handleMouseMove;
  }
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
    //alert("Not connected to database, syncing offline. Connect later to sync online.");
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

function update()
{
  if (game)
  {
    timer += 0.01;

    document.getElementById("gameTimer").innerHTML = (timer.toFixed(2)).toString();
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

function getTotalResponses(surveyIndex)
{
  var responses = 0;

  for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, 0); answerIndex++)
  {
    responses += getAnswerResponses(surveyIndex, 0, answerIndex);
  }

  return responses;
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

  makeElement(editorPanel, "div", "Survey Name:", "fieldHeader", "");
  var surveyHeader = makeElement(editorPanel, "input", getSurveyName(surveyIndex), "surveyHeader", surveyIndex.toString());
  surveyHeader.setAttribute("onchange", "setSurveyName('" + surveyHeader.id + "', " + surveyIndex.toString() + ")");
  surveyHeader.focus();
  surveyHeader.select();

  makeElement(editorPanel, "hr", "", "break", "");

  makeElement(editorPanel, "div", "Questions:", "fieldHeader", "");
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

  makeElement(editorPanel, "hr", "", "break", "");

  makeElement(editorPanel, "div", "Survey Date:", "fieldHeader", "");
  var surveyDate = makeElement(editorPanel, "input", getSurvey(surveyIndex).date, "surveyDate", surveyIndex.toString());
  surveyDate.setAttribute("onchange", "setSurveyDate('" + surveyDate.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Survey Location:", "fieldHeader", "");
  var surveyLocation = makeElement(editorPanel, "input", getSurvey(surveyIndex).location, "surveyLocation", surveyIndex.toString());
  surveyLocation.setAttribute("onchange", "setSurveyLocation('" + surveyLocation.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Show Welcome Message?:", "fieldHeader", surveyIndex.toString());
  var surveyShowWelcomeMessage = makeElement(editorPanel, "input", "", "surveyShowWelcomeMessage", surveyIndex.toString());
  surveyShowWelcomeMessage.setAttribute("type", "checkbox");
  surveyShowWelcomeMessage.checked = getSurvey(surveyIndex).showWelcomeMessage;
  surveyShowWelcomeMessage.setAttribute("onchange", "setShowWelcomeMessage('" + surveyShowWelcomeMessage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Welcome Message:", "fieldHeader", surveyIndex.toString());
  var surveyWelcomeMessage = makeElement(editorPanel, "input", getSurvey(surveyIndex).welcomeMessage, "surveyWelcomeMessage", surveyIndex.toString());
  surveyWelcomeMessage.setAttribute("onchange", "setSurveyWelcomeMessage('" + surveyWelcomeMessage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Show Welcome Image?:", "fieldHeader", surveyIndex.toString());
  var surveyShowWelcomeImage = makeElement(editorPanel, "input", "", "surveyShowWelcomeImage", surveyIndex.toString());
  surveyShowWelcomeImage.setAttribute("type", "checkbox");
  surveyShowWelcomeImage.checked = getSurvey(surveyIndex).showWelcomeImage;
  surveyShowWelcomeImage.setAttribute("onchange", "setShowWelcomeImage('" + surveyShowWelcomeImage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Welcome Image URL:", "fieldHeader", surveyIndex.toString());
  var surveyWelcomeImage = makeElement(editorPanel, "input", getSurvey(surveyIndex).welcomeImage, "surveyWelcomeImage", surveyIndex.toString());
  surveyWelcomeImage.setAttribute("onchange", "setSurveyWelcomeImage('" + surveyWelcomeImage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "End Message:", "fieldHeader", surveyIndex.toString());
  var surveyEndMessage = makeElement(editorPanel, "input", getSurvey(surveyIndex).endMessage, "surveyEndMessage", surveyIndex.toString());
  surveyEndMessage.setAttribute("onchange", "setSurveyEndMessage('" + surveyEndMessage.id + "', " + surveyIndex.toString() + ")");

  makeElement(editorPanel, "div", "Button colours:", "fieldHeader", surveyIndex.toString());

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var buttonColour = makeElement(editorPanel, "input", "", "buttonColour" + buttonIndex.toString(), surveyIndex.toString());
    buttonColour.setAttribute("type", "color");
    buttonColour.value = getSurvey(surveyIndex).buttonColours["button" + buttonIndex];
    buttonColour.style.backgroundColor = "#" + buttonColour.value;
    buttonColour.setAttribute("onchange", "setButtonColour('" + buttonColour.id + "', " + buttonIndex + ", " + surveyIndex.toString() + ")");
  }

  makeElement(editorPanel, "hr", "", "break", "");

  var surveySaveButton = makeElement(editorPanel, "button", "save survey", "surveySaveButton", surveyIndex.toString());
  surveySaveButton.setAttribute("onclick", "saveSurvey(" + surveyIndex.toString() + ")");
}

function editQuestion(surveyIndex, questionIndex, highlightIndex)
{
    activeQuestionIndex = questionIndex;

    var editorPanel = document.getElementById("editorPanel");

    editorPanel.innerHTML = "";

    makeElement(editorPanel, "div", "Question Name:", "fieldHeader", "");
    var questionHeader = makeElement(editorPanel, "input", getQuestionName(surveyIndex, questionIndex), "questionHeader", questionIndex.toString());
    questionHeader.setAttribute("onchange", "setQuestionName('" + questionHeader.id + "', " + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    if (highlightIndex == undefined)
    {
      questionHeader.focus();
      questionHeader.select();
    }

    makeElement(editorPanel, "div", "Answers (number of responses):", "fieldHeader", "");
    var answerPanel = makeElement(editorPanel, "div", "", "answerPanel", "")

    for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, questionIndex); answerIndex++)
    {
      var answerRow = makeElement(answerPanel, "div", "", "answerRow", answerIndex.toString());

      var answerTitle = makeElement(answerRow, "input", getAnswerName(surveyIndex, questionIndex, answerIndex), "answerTitle", answerIndex.toString());
      answerTitle.setAttribute("onchange", "setAnswerName('" + answerTitle.id.toString() + "', " + surveyIndex.toString() + ", " + questionIndex.toString() + ", " + answerIndex.toString() + ")");

      var answerResponses = makeElement(answerRow, "span", "(" + getAnswerResponses(surveyIndex, questionIndex, answerIndex) + ")", "answerResponses", answerIndex.toString());

      makeElement(answerRow, "br", "", "", "");

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

function setSurveyDate(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].date = document.getElementById(elementId).value;
}

function setSurveyLocation(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].location = document.getElementById(elementId).value;
}

function setShowWelcomeMessage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].showWelcomeMessage = document.getElementById(elementId).checked;
}

function setSurveyWelcomeMessage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].welcomeMessage = document.getElementById(elementId).value;
}

function setShowWelcomeImage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].showWelcomeImage = document.getElementById(elementId).checked;
}

function setSurveyWelcomeImage(elementId, surveyIndex)
{
  surveys["survey" + surveyIndex.toString()].welcomeImage = document.getElementById(elementId).value;
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

function setButtonColour(elementId, buttonIndex, surveyIndex)
{
  document.getElementById(elementId).style.backgroundColor = "#" + document.getElementById(elementId).value;
  surveys["survey" + surveyIndex.toString()].buttonColours["button" + buttonIndex.toString()] = document.getElementById(elementId).value;
}

function addSurvey()
{
  console.log(surveys);

  surveys["survey" + getSurveyCount().toString()] = { "surveyName":"new survey", "date":"0/0/0", "location":"Scotland", "buttonColours":{"button0":defaultButtonColours[0], "button1":defaultButtonColours[1], "button2":defaultButtonColours[2], "button3":defaultButtonColours[3]}, "welcomeMessage":defaultWelcomeMessage, "showWelcomeMessage":false, "welcomeImage":"images/default-background.jpg", "showWelcomeImage":false, "endMessage":defaultEndMessage, "questions": {"question0":{"questionName":"new question", "answers":{"answer0":{"answerName":"new answer", "responses":0}}}}};

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

function transitionSurveyRightToCenter()
{
  document.getElementById("activePanel").classList.remove("moveCenterLeft");
  document.getElementById("activePanel").classList.add("moveRightCenter");
}

function transitionSurveyCenterToLeft()
{
  document.getElementById("activePanel").classList.remove("moveRightCenter");
  document.getElementById("activePanel").classList.add("moveCenterLeft");
}

function shrinkButtons(answerIndex)
{
  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    if (buttonIndex == answerIndex)
    {
      activeButtons[buttonIndex].classList.add("grow");
    }
    else
    {
      activeButtons[buttonIndex].classList.add("shrink");
    }
  }
}

function runSurvey(surveyIndex)
{
  document.getElementById("editorPanel").innerHTML = "";
  document.getElementById("activePanel").style.visibility = "visible";

  launchIntoFullscreen(document.documentElement);

  runningSurvey = true;

  document.getElementById("header").style.visibility = "hidden";

  document.body.style.overflow = "hidden";

  activeSurveyIndex = surveyIndex;
  activeQuestionIndex = 0;

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    buttonColours[buttonIndex] = getSurvey(surveyIndex).buttonColours["button" + buttonIndex.toString()];
  }

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
  var showWelcomeMessage = getSurvey(activeSurveyIndex).showWelcomeMessage;

  if ((showWelcomeMessage && !displayingWelcomeMessage) || (!showWelcomeMessage && activeQuestionIndex > 0))
  {
      displayingEndMessage = false;
      displayingWelcomeMessage = false;

      game = false;

      syncSurvey(activeSurveyIndex, -1);

      transitionSurveyCenterToLeft();

      setTimeout(runSurvey, transitionTime, activeSurveyIndex);
  }
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

  var activePanel = document.getElementById("activePanel");
  activePanel.innerHTML = "";

  var questionHeader = makeElement(activePanel, "div", getQuestionName(surveyIndex, questionIndex), "activeQuestionHeader", questionIndex.toString());

  var answerPanel = makeElement(activePanel, "div", "", "activeAnswerPanel", "")

  activeButtons = [];

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var answerSelectButton;

    if (buttonIndex < getAnswerCount(surveyIndex, questionIndex))
    {
      answerSelectButton = makeElement(answerPanel, "button", getAnswerName(surveyIndex, questionIndex, buttonIndex), "answerSelectButton", buttonIndex.toString());
      answerSelectButton.setAttribute("onclick", "saveResponse(" + buttonIndex.toString() + ")");
      answerSelectButton.style.backgroundColor = "#" + buttonColours[buttonIndex];
    }
    else
    {
      answerSelectButton = makeElement(answerPanel, "button", "", "inactiveAnswerSelectButton", buttonIndex.toString());
    }

    activeButtons.push(answerSelectButton);
  }

  transitionSurveyRightToCenter();
}

function saveResponse(answerIndex)
{
  surveys["survey" + activeSurveyIndex.toString()].questions["question" + activeQuestionIndex.toString()].answers["answer" + answerIndex.toString()].responses += 1;

  displayNextQuestion(false, answerIndex);
}

function displayNextQuestion(firstQuestion, answerIndex)
{
  displayingWelcomeMessage = false;

  var transitionDelay = 0;

  pressSound.play();

  if (firstQuestion == false)
  {
    activeQuestionIndex += 1;
    shrinkButtons(answerIndex);
    transitionDelay = buttonShrinkTime;
  }

  setTimeout(transitionSurveyCenterToLeft, transitionDelay);

  if (activeQuestionIndex >= getQuestionCount(activeSurveyIndex))
  {
    setTimeout(displayEndMessage, transitionTime + transitionDelay);
  }
  else
  {
    setTimeout(displayActiveQuestion, transitionTime + transitionDelay);
  }
}

function displayWelcomeMessage()
{
  displayingWelcomeMessage = true;

  var activePanel = document.getElementById("activePanel");
  activePanel.innerHTML = "";

  var welcomeMessage = makeElement(activePanel, "div", getSurvey(activeSurveyIndex).welcomeMessage, "activeWelcomeMessage", "")

  var continueMessage = makeElement(activePanel, "div", defaultContinueMessage, "continueMessage", "")

  var answerPanel = makeElement(activePanel, "div", "", "activeAnswerPanel", "")

  if (getSurvey(activeSurveyIndex).showWelcomeImage)
  {
      var imagePanel = makeElement(activePanel, "div", "", "imagePanel", "");
      imagePanel.style.backgroundImage = "url('" + getSurvey(activeSurveyIndex).welcomeImage + "')";
  }

  activeButtons = [];

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var answerSelectButton = makeElement(answerPanel, "button", "", "inactiveAnswerSelectButton", buttonIndex.toString());
    answerSelectButton.setAttribute("onclick", "displayNextQuestion(true, 0)");
    answerSelectButton.style.visibility = "hidden";
    activeButtons.push(answerSelectButton);
  }

  transitionSurveyRightToCenter();
}

function displayEndMessage()
{
  displayingEndMessage = true;

  var activePanel = document.getElementById("activePanel");
  activePanel.innerHTML = "";

  if (getSurvey(activeSurveyIndex).endMessage == "uuddlrlrba")
  {
    displayGame();
    return;
  }

  var endMessage = makeElement(activePanel, "div", getSurvey(activeSurveyIndex).endMessage, "activeEndMessage", "")

  var continueMessage = makeElement(activePanel, "div", defaultContinueMessage, "continueMessage", "")

  var answerPanel = makeElement(activePanel, "div", "", "activeAnswerPanel", "")

  activeButtons = [];

  for (var buttonIndex = 0; buttonIndex < buttonCount; buttonIndex++)
  {
    var answerSelectButton = makeElement(answerPanel, "button", "", "inactiveAnswerSelectButton", buttonIndex.toString());
    answerSelectButton.setAttribute("onclick", "restartSurvey()");
    answerSelectButton.style.visibility = "hidden";

    activeButtons.push(answerSelectButton);
  }

  transitionSurveyRightToCenter();
}

function displayGame()
{
    var gameTimer = makeElement(activePanel, "div", "00.00", "gameTimer", "");
    var gameButton = makeElement(activePanel, "button", "GROW THE INDUSTRY!", "gameButton", "");
    var gameGoal = makeElement(activePanel, "button", "", "gameGoal", "");

    gameButton.setAttribute("onclick", "growIndustry()");

    game = true;
    timer = 0.0;
    industry = 0;

    transitionSurveyRightToCenter();
}

function growIndustry()
{
  industry += 1.0;
  document.getElementById("gameButton").style.transform = "scale(" + (1.0 + (industry / 50)).toString() + ")";
  document.getElementById("gameButton").style.backgroundColor = '#' + Math.floor(Math.random() * 6777215 + 10000000).toString(16);

  if (industry > 75)
  {
    game = false;

    if (window.localStorage.getItem("bestTime") == null || window.localStorage.getItem("bestTime") > timer)
    {
      window.localStorage.setItem("bestTime", timer);
      document.getElementById("gameTimer").innerHTML = "NEW HIGHSCORE! " + (timer.toFixed(2)).toString();
    }

    document.getElementById("gameButton").innerHTML = "You Grew The Industry!";

    setTimeout(restartSurvey, 5000);
  }
}

function exitSurvey()
{
  game = false;

  runningSurvey = false;

  document.getElementById("activePanel").style.visibility = "hidden";
  document.getElementById("activePanel").innerHTML = "";

  document.getElementById("header").style.visibility = "visible";

  document.body.style.overflow = "visible";

  displaySurveys();
}

function viewSurveyResults(surveyIndex)
{
  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  var surveyHeader = makeElement(editorPanel, "div", getSurveyName(surveyIndex), "surveyResultsHeader", surveyIndex.toString());
  var surveyDate = makeElement(editorPanel, "div", getSurvey(surveyIndex).date, "surveyResultsDate", surveyIndex.toString());
  var surveyLocation = makeElement(editorPanel, "div", getSurvey(surveyIndex).location, "surveyResultsLocation", surveyIndex.toString());

  var questionPanel = makeElement(editorPanel, "div", "", "questionPanel", "")

  for (var questionIndex = 0; questionIndex < getQuestionCount(surveyIndex); questionIndex++)
  {
    var questionRow = makeElement(questionPanel, "div", "", "questionRow", questionIndex.toString());

    var questionTitle = makeElement(questionRow, "div", getQuestionName(surveyIndex, questionIndex), "questionResultsTitle", questionIndex.toString());

    makeElement(questionPanel, "hr", "", "break", "");

    var answerPanel = makeElement(questionRow, "div", "", "answerPanel", questionIndex.toString())

    for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, questionIndex); answerIndex++)
    {
      var answerRow = makeElement(answerPanel, "div", "", "answerRow", answerIndex.toString());

      var answerTitle = makeElement(answerRow, "span", getAnswerName(surveyIndex, questionIndex, answerIndex), "answerResultsTitle", answerIndex.toString());

      var answerResponses = makeElement(answerRow, "span", getAnswerResponses(surveyIndex, questionIndex, answerIndex), "answerResultsResponses", answerIndex.toString());
    }
  }

  makeElement(editorPanel, "span", "Total Responses", "totalResultsResponsesHeader", "");
  var totalResponses = makeElement(editorPanel, "span", getTotalResponses(surveyIndex), "totalResultsResponses", questionIndex.toString());

  makeElement(editorPanel, "hr", "", "break", "");

  var exportLink = makeElement(editorPanel, "a", "export", "exportLink", surveyIndex.toString());
  var blob = new Blob(["\ufeff", constructCsv(surveyIndex)]);
  var url = URL.createObjectURL(blob);
  exportLink.href = url;
  exportLink.download = "results.csv";

  var backButton = makeElement(editorPanel, "button", "back", "backButton", surveyIndex.toString());
  backButton.setAttribute("onclick", "displaySurveys()");
}

function constructCsv(surveyIndex)
{
    var str = "";

    str += "Survey Name," + getSurveyName(surveyIndex) + "\n";

    str += "Survey Data," + getSurvey(surveyIndex).date + "\n";

    str += "Survey Location," + getSurvey(surveyIndex).location + "\n";

    str += "\n";

    str += "Question,Answer,Responses\n";

    for (var questionIndex = 0; questionIndex < getQuestionCount(surveyIndex); questionIndex++)
    {
        for (var answerIndex = 0; answerIndex < getAnswerCount(surveyIndex, questionIndex); answerIndex++)
        {
          var line = "";

          if (answerIndex == 0)
          {
            line += getQuestionName(surveyIndex, questionIndex) + ",";
          }
          else
          {
            line += ",";
          }

          line += getAnswerName(surveyIndex, questionIndex, answerIndex) + "," + getAnswerResponses(surveyIndex, questionIndex, answerIndex);

          str += line + "\n";
        }
    }

    str += "\nTotal Responses," + getTotalResponses(surveyIndex) + "\n";

    return str;
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

  if (game)
  {
    $("#gameButton").addClass("active");
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

  if (game)
  {
    $("#gameButton").click();
    $("#gameButton").removeClass("active");
    pressSound.play();
  }

  event.preventDefault();
}

function output(msg)
{
  console.log(msg);
}

function handleMouseDown()
{
  if (runningSurvey)
  {
    if (displayingWelcomeMessage || displayingEndMessage)
    {
      $(activeButtons[0]).click();
    }
  }
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
