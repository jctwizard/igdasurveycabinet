if (navigator.onLine)
{
  getElementById("status").innerHtml = "online";
  console.log("online");
}
else
{
  getElementById("status").innerHtml = "offline";
  console.log("offline");
}
