const { renderFile, render } = require("ejs");

const slider = document.querySelector('.heroImgSlider');
const images = document.querySelectorAll('.heroImgSlider img');

let current = 0;

function sliderChange() {
  for (let i = 0; i < images.length; i++) {
    images[i].style.display = "none";
  }

  current = (current + 1) % images.length;

  images[current].style.display = "block";
}

setInterval(sliderChange, 5000);



window.onload = function () {
 

}

// This method is called on click of checkout button.
function adminDashboardSetState(selectedAction) {
  //alert("call receieved: " + selectedAction);
  var adminRegisteredStudents = document.getElementById("adminRegisteredStudents");
  var adminEnrolledStudents = document.getElementById("adminEnrolledStudents");
  var adminRegisterNewStudent = document.getElementById("adminRegisterNewStudent");
  //var adminCreateStudentLogin = document.getElementById("adminCreateStudentLogin");

  adminRegisteredStudents.style.display = "none";
    adminEnrolledStudents.style.display = "none";
    adminRegisterNewStudent.style.display = "none";

  if (selectedAction == "adminRegisteredStudents") {
    // adminPostAnnouncement.style.display = "none";
    adminRegisteredStudents.style.display = "block";
    adminEnrolledStudents.style.display = "none";
    adminRegisterNewStudent.style.display = "none";

  } else if (selectedAction == "adminEnrolledStudents") {
    // adminPostAnnouncement.style.display = "none";
    adminRegisteredStudents.style.display = "none";
    adminEnrolledStudents.style.display = "block";
    adminRegisterNewStudent.style.display = "none";
  }
  else if (selectedAction == "adminRegisterNewStudent") {
    // adminPostAnnouncement.style.display = "none";
    adminRegisteredStudents.style.display = "none";
    adminEnrolledStudents.style.display = "none";
    adminRegisterNewStudent.style.display = "block";
  }
  return selectedAction;
}


