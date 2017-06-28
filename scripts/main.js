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
    });
  }
  else
  {
    document.getElementById("status").innerHTML = "offline";
    console.log("offline");
    window.localStorage.setItem("syncRequired", true);
    surveys = window.localStorage.getItem("surveys");
  }
}

function displaySurveys()
{
  var surveyList = document.getElementById("surveyList");
  var surveyNames = Object.keys(surveys);

  surveyList.innerHTML = "";

  for (var surveyIndex = 0; surveyIndex < surveyNames.length; surveyIndex++)
  {
    surveyList.innerHTML += "<div>" + surveyNames[surveyIndex] + "</div>";
  }
}

function displayQuestions()
{

}

function displayAnswers()
{

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
