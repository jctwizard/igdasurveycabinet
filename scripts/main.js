// Firebase config
var config = {
  apiKey: "AIzaSyBE5MOWlHjCG1uifUhViweuKo4pbn3RceY",
  authDomain: "igda-survey-arcade.firebaseapp.com",
  databaseURL: "https://igda-survey-arcade.firebaseio.com",
  projectId: "igda-survey-arcade"
};

var database;

document.getElementById("status").innerHTML = "starting up...";

function showStatus()
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

    // Get reference to the database
    database = firebase.database();

    // Read survey data
    firebase.database().ref("/igda-survey-arcade").once("value").then(function(data) {
      console.log("output data: ");
      console.log(data.val());
    });
  }
  else
  {
    document.getElementById("status").innerHTML = "offline";
    console.log("offline");
  }
}
