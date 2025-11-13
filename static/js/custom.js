document.addEventListener("DOMContentLoaded", function() {

    // Set timeout for message display
    setTimeout(function () {
        let messages = document.querySelector('.messages');
        let alert = new bootstrap.Alert(messages);
        alert.close();
    }, 3420);

    // UserOptions icon behavior
    const menuIcon = document.getElementById("menu-icon");
    const userOptions = document.querySelector(".user-options");
    
    // Toggle the visibility of the menu icon and user options on click
    // menuIcon.addEventListener("click", function(event) {
    //   event.preventDefault();
    //   userOptions.classList.toggle("d-none"); // Show or hide user options
    //   userOptions.classList.toggle("show");
    //   menuIcon.classList.toggle("d-none"); // Hide the menu icon
    // });
  
    // Optional: Hide user options if clicking outside the menu or options
    // document.addEventListener("click", function(event) {
    //   if (!menuIcon.contains(event.target) && !userOptions.contains(event.target)) {
    //     userOptions.classList.add("d-none"); // Hide user options
    //     userOptions.classList.remove("show");
    //     menuIcon.classList.remove("d-none"); // Show the menu icon again
    //   }
    // });
    

});
