// Firebase config
var config = {
  apiKey: "AIzaSyBE5MOWlHjCG1uifUhViweuKo4pbn3RceY",
  authDomain: "igda-survey-arcade.firebaseapp.com",
  databaseURL: "https://igda-survey-arcade.firebaseio.com",
  projectId: "igda-survey-arcade"
};

var surveys;

var activeSurveyIndex = 0;
var activeQuestionIndex = 0;

document.getElementById("status").innerHTML = "starting up...";

function init()
{
  if (navigator.onLine)
  {
    document.getElementById("status").innerHTML = "online";
    console.log("online");

    // Initialize Firebase
    firebase.initializeApp(config);

    // Authenticate user
    firebase.auth().signInWithEmailAndPassword("jamie.ct.wood@gmail.com", "m1n1flam3").catch(function(error) {
      console.log(error.code);
      console.log(error.message);
    });

    // Read survey data
    firebase.database().ref("surveys").once("value").then(function(data) {
      surveys = data.val();
      displaySurveys();
    });
  }
  else
  {
    document.getElementById("status").innerHTML = "offline";
    console.log("offline");
    window.localStorage.setItem("syncRequired", true);
    surveys = window.localStorage.getItem("surveys");
    displaySurveys();
  }
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

function displaySurveys()
{
  var editorPanel = document.getElementById("editorPanel");
  var surveyNames = Object.keys(surveys);

  editorPanel.innerHTML = "";

  var surveyPanel = makeElement(editorPanel, "div", "", "surveyPanel", "");

  for (var surveyIndex = 0; surveyIndex < surveyNames.length; surveyIndex++)
  {
    var surveyRow = makeElement(surveyPanel, "div", "", "surveyRow", surveyIndex.toString());

    var surveyTitle = makeElement(surveyRow, "span", surveys[surveyNames[surveyIndex]].surveyName, "surveyTitle", surveyIndex.toString());

    var surveyEditButton = makeElement(surveyRow, "button", "edit survey", "surveyEditButton", surveyIndex.toString());
    surveyEditButton.setAttribute("onclick", "editSurvey(" + surveyIndex.toString() + ")");

    var surveyRunButton = makeElement(surveyRow, "button", "run survey", "surveyRunButton", surveyIndex.toString());
    surveyRunButton.setAttribute("onclick", "runSurvey(" + surveyIndex.toString() + ")");

    var surveyResultsButton = makeElement(surveyRow, "button", "view results", "surveyResultsButton", surveyIndex.toString());
    surveyResultsButton.setAttribute("onclick", "viewSurveyResults(" + surveyIndex.toString() + ")");
  }

  var addSurveyButton = makeElement(editorPanel, "button", "add survey", "addSurveyButton", "");
  addSurveyButton.setAttribute("onclick", "addSurvey()");
}

function editSurvey(surveyIndex)
{
  activeSurveyIndex = surveyIndex;

  var editorPanel = document.getElementById("editorPanel");
  editorPanel.innerHTML = "";

  var surveyNames = Object.keys(surveys);

  var surveyHeader = makeElement(editorPanel, "input", surveys[surveyNames[surveyIndex]].surveyName, "surveyHeader", surveyIndex.toString());

  var questionPanel = makeElement(editorPanel, "div", "", "questionPanel", "")

  var questionNames = Object.keys(surveys[surveyNames[surveyIndex]].questions);

  for (var questionIndex = 0; questionIndex < questionNames.length; questionIndex++)
  {
    var questionRow = makeElement(questionPanel, "div", "", "questionRow", questionIndex.toString());

    var questionTitle = makeElement(questionRow, "span", surveys[surveyNames[surveyIndex]].questions[questionNames[questionIndex]].questionName, "questionTitle", questionIndex.toString());

    var questionEditButton = makeElement(questionRow, "button", "edit question", "questionEditButton", questionIndex.toString());
    questionEditButton.setAttribute("onclick", "editQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");
  }

  var addQuestionButton = makeElement(editorPanel, "button", "add question", "addQuestionButton", "");
  addQuestionButton.setAttribute("onclick", "addQuestion(" + surveyIndex.toString() + ")");

  var surveyCancelButton = makeElement(editorPanel, "button", "cancel edit", "surveyCancelButton", surveyIndex.toString());
  surveyCancelButton.setAttribute("onclick", "displaySurveys()");

  var surveySaveButton = makeElement(editorPanel, "button", "save survey", "surveySaveButton", surveyIndex.toString());
  surveySaveButton.setAttribute("onclick", "saveSurvey(" + surveyIndex.toString() + ")");
}

function editQuestion(surveyIndex, questionIndex)
{
    activeQuestionIndex = questionIndex;

    var editorPanel = document.getElementById("editorPanel");

    editorPanel.innerHTML = "";

    var surveyNames = Object.keys(surveys);
    var questionNames = Object.keys(surveys[surveyNames[surveyIndex]].questions);

    var questionHeader = makeElement(editorPanel, "input", surveys[surveyNames[surveyIndex]].questions[questionNames[questionIndex]].questionName, "questionHeader", questionIndex.toString());

    var answerPanel = makeElement(editorPanel, "div", "", "answerPanel", "")

    var answerNames = Object.keys(surveys[surveyNames[surveyIndex]].questions[questionNames[questionIndex]].answers);

    for (var answerIndex = 0; answerIndex < answerNames.length; answerIndex++)
    {
      var answerRow = makeElement(answerPanel, "div", "", "answerRow", answerIndex.toString());

      var answerTitle = makeElement(answerRow, "input", surveys[surveyNames[surveyIndex]].questions[questionNames[questionIndex]].answers[answerNames[answerIndex]].answerName, "answerTitle", answerIndex.toString());
    }

    var addAnswerButton = makeElement(editorPanel, "button", "add answer", "addAnswerButton", "");
    addAnswerButton.setAttribute("onclick", "addAnswer(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

    var questionCancelButton = makeElement(editorPanel, "button", "cancel edit", "questionCancelButton", questionIndex.toString());
    questionCancelButton.setAttribute("onclick", "editSurvey(" + surveyIndex.toString() + ")");

    var questionSaveButton = makeElement(editorPanel, "button", "save question", "questionSaveButton", questionIndex.toString());
    questionSaveButton.setAttribute("onclick", "saveQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");
}

function addSurvey()
{
  var surveyPanel = document.getElementById("surveyPanel");
  var surveyNames = Object.keys(surveys);
  var surveyIndex = surveyNames.length;

  var surveyRow = makeElement(surveyPanel, "div", "", "surveyRow", surveyIndex.toString());

  var surveyTitle = makeElement(surveyRow, "span", "new survey", "surveyTitle", surveyIndex.toString());

  var surveyEditButton = makeElement(surveyRow, "button", "edit survey", "surveyEditButton", surveyIndex.toString());
  surveyEditButton.setAttribute("onclick", "editSurvey(" + surveyIndex.toString() + ")");

  var surveyRunButton = makeElement(surveyRow, "button", "run survey", "surveyRunButton", surveyIndex.toString());
  surveyRunButton.setAttribute("onclick", "runSurvey(" + surveyIndex.toString() + ")");

  var surveyResultsButton = makeElement(surveyRow, "button", "view results", "surveyResultsButton", surveyIndex.toString());
  surveyResultsButton.setAttribute("onclick", "viewSurveyResults(" + surveyIndex.toString() + ")");

  surveys["survey" + surveyIndex.toString()] = { "surveyName":"new survey", "questions": {}};

  editSurvey(surveyIndex);
}

function addQuestion(surveyIndex)
{
  var questionPanel = document.getElementById("questionPanel");
  var surveyNames = Object.keys(surveys);
  var questionNames = Object.keys(surveys[surveyNames[surveyIndex]]);
  var questionIndex = questionNames.length;

  var questionRow = makeElement(questionPanel, "div", "", "questionRow", questionIndex.toString());

  var questionTitle = makeElement(questionRow, "span", "new question", "questionTitle", questionIndex.toString());

  var questionEditButton = makeElement(questionRow, "button", "edit question", "questionEditButton", questionIndex.toString());
  questionEditButton.setAttribute("onclick", "editQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");

  surveys[surveyNames[surveyIndex]].questions["question" + questionIndex.toString()] = { "questionName":"new question", "answers": {}};

  editQuestion(surveyIndex, questionIndex);
}

function addAnswer(surveyIndex, questionIndex)
{
  var answerPanel = document.getElementById("answerPanel");
  var surveyNames = Object.keys(surveys);
  var questionNames = Object.keys(surveys[surveyNames[surveyIndex]]);
  var answerNames = Object.keys(surveys[surveyNames[surveyIndex]][questionNames[questionIndex]]);
  var answerIndex = answerNames.length;

  var answerRow = makeElement(answerPanel, "div", "", "answerRow", answerIndex.toString());

  var answerTitle = makeElement(answerRow, "input", "enter answer here", "answerTitle", answerIndex.toString());

  surveys[surveyNames[surveyIndex]].questions[questionNames[questionIndex]].answers["answer" + answerIndex.toString()] = { "answerName":"enter answer here", "responses":0 };
}

function saveSurvey(surveyIndex)
{
  displaySurveys();
}

function saveQuestion(surveyIndex, questionIndex)
{
  editSurvey(surveyIndex);
}

function runSurvey(surveyIndex)
{

}

function viewSurveyResults(surveyIndex)
{

}
