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

function makeElement(type, name, suffix, content, parent)
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
  var surveyList = document.getElementById("surveyList");
  var surveyNames = Object.keys(surveys);

  surveyList.innerHTML = "";

  for (var surveyIndex = 0; surveyIndex < surveyNames.length; surveyIndex++)
  {
    var surveyRow = makeElement("div", "surveyRow", surveyIndex.toString(), "", surveyList);

    var surveyTitle = makeElement("span", "surveyTitle", surveyIndex.toString(), surveyNames[surveyIndex], surveyRow);

    var surveyEditButton = makeElement("button", "surveyEditButton", surveyIndex.toString(), "edit survey", surveyRow);
    surveyEditButton.setAttribute("onclick", "editSurvey(" + surveyIndex.toString() + ")");

    var surveyRunButton = makeElement("button", "surveyRunButton", surveyIndex.toString(), "run survey", surveyRow);
    surveyRunButton.setAttribute("onclick", "runSurvey(" + surveyIndex.toString() + ")");

    var surveyResultsButton = makeElement("button", "surveyResultsButton", surveyIndex.toString(), "view results", surveyRow);
    surveyResultsButton.setAttribute("onclick", "viewSurveyResults(" + surveyIndex.toString() + ")");
  }
}

function editSurvey(surveyIndex)
{
  activeSurveyIndex = surveyIndex;

  var surveyList = document.getElementById("surveyList");
  surveyList.innerHTML = "";

  var surveyNames = Object.keys(surveys);

  var surveyHeader = makeElement("input", "surveyHeader", surveyIndex.toString(), surveyNames[surveyIndex], surveyList);

  var questionNames = Object.keys(surveys[surveyNames[surveyIndex]]);

  for (var questionIndex = 0; questionIndex < questionNames.length; questionIndex++)
  {
    var questionRow = makeElement("div", "questionRow", questionIndex.toString(), "", surveyList);

    var questionTitle = makeElement("span", "questionTitle", questionIndex.toString(), questionNames[questionIndex], questionRow);

    var questionEditButton = makeElement("button", "questionEditButton", questionIndex.toString(), "edit question", questionRow);
    questionEditButton.setAttribute("onclick", "editQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");
  }

  var surveyCancelButton = makeElement("button", "surveyCancelButton", surveyIndex.toString(), "cancel edit", surveyList);
  surveyCancelButton.setAttribute("onclick", "displaySurveys()");

  var surveySaveButton = makeElement("button", "surveySaveButton", surveyIndex.toString(), "save survey", surveyList);
  surveySaveButton.setAttribute("onclick", "saveSurvey(" + surveyIndex.toString() + ")");
}

function editQuestion(surveyIndex, questionIndex)
{
    activeQuestionIndex = questionIndex;

    var surveyList = document.getElementById("surveyList");

    surveyList.innerHTML = "";

    var surveyNames = Object.keys(surveys);
    var questionNames = Object.keys(surveys[surveyNames[surveyIndex]]);

    var questionHeader = makeElement("input", "questionHeader", questionIndex.toString(), questionNames[questionIndex], surveyList);

    var answerNames = Object.keys(surveys[surveyNames[surveyIndex]][questionNames[questionIndex]]);

    for (var answerIndex = 0; answerIndex < answerNames.length; answerIndex++)
    {
      var answerRow = makeElement("div", "answerRow", answerIndex.toString(), "", surveyList);

      var answerTitle = makeElement("input", "answerTitle", answerIndex.toString(), answerNames[answerIndex], answerRow);
    }

    var questionCancelButton = makeElement("button", "questionCancelButton", questionIndex.toString(), "cancel edit", surveyList);
    questionCancelButton.setAttribute("onclick", "editSurvey(" + surveyIndex.toString() + ")");

    var questionSaveButton = makeElement("button", "questionSaveButton", questionIndex.toString(), "save question", surveyList);
    questionSaveButton.setAttribute("onclick", "saveQuestion(" + surveyIndex.toString() + ", " + questionIndex.toString() + ")");
}

function saveSurvey(surveyIndex)
{
  displaySurveys();
}

function saveQuestion(surveyIndex, questionIndex)
{
  editSurvey(surveyIndex);
}

function addSurvey()
{

}

function addQuestion()
{

}

function addAnswer()
{

}

function runSurvey(surveyIndex)
{

}

function viewSurveyResults(surveyIndex)
{

}
