if (navigator.onLine)
{
  document.getElementById("status").innerHtml = "online";
  console.log("online");
}
else
{
  document.getElementById("status").innerHtml = "offline";
  console.log("offline");
}
