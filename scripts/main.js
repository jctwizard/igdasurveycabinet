document.getElementById("status").innerHTML = "starting up...";

function showStatus()
{
  if (navigator.onLine)
  {
    document.getElementById("status").innerHTML = "online";
    console.log("online");
  }
  else
  {
    document.getElementById("status").innerHTML = "offline";
    console.log("offline");
  }
}
