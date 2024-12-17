document.addEventListener("DOMContentLoaded", function() {

    // Set timeout for message display
    setTimeout(function () {
        let messages = document.getElementById('msg');
        let alert = new bootstrap.Alert(messages);
        alert.close();
    }, 3420);

    // UserOptions icon behavior
    const menuIcon = document.getElementById("menu-icon");
    const userOptions = document.querySelector(".user-options");
    
    // Toggle the visibility of the menu icon and user options on click
    menuIcon.addEventListener("click", function(event) {
      event.preventDefault();
      userOptions.classList.toggle("d-none"); // Show or hide user options
      userOptions.classList.toggle("show");
      menuIcon.classList.toggle("hide"); // Hide the menu icon
    });
  
    // Optional: Hide user options if clicking outside the menu or options
    document.addEventListener("click", function(event) {
      if (!menuIcon.contains(event.target) && !userOptions.contains(event.target)) {
        userOptions.classList.add("d-none"); // Hide user options
        userOptions.classList.remove("show");
        menuIcon.classList.remove("hide"); // Show the menu icon again
      }
    });
    
    // USERS AND REGISTER FUNCTIONS
    // Function to handle signup or login  errors
    function handleError(errors)  {
      // Construct the error message list
      let errorMessage = '<ul>';
      try {
          // Handle errors assuming they are in a format such as {"field_name": ["error message"]}
          Object.keys(errors).forEach(field => {
              let fieldErrors = JSON.parse(errors[field]);
              fieldErrors.forEach(err => {
                  errorMessage += `<li>${err}</li>`;
              });
          });
      } catch (e) {
          console.error('Error parsing error messages', e);
          errorMessage = 'An unexpected error occurred.';
      }
      errorMessage += '</ul>';
      // Display the error message in the modal
      $('#modalError').html(errorMessage)
                      .css('background-color', '#a7092b7a')
                      .show();
    };

    // Function to handle AJAX error responses
    function handleAjaxError(xhr)   {
      var errorMessage = 'Error:';
      try {
          var response = JSON.parse(xhr.responseText);
          if (response.errors) {
              handleError(response.errors);
          } else {
              errorMessage += ' ' + response;
          }
      } catch (e) {
          errorMessage += ' ' + xhr.responseText;
      }
      $('#modalError').html(errorMessage)
                      .css('background-color', '#a7092b7a')
                      .show();
      console.error(xhr.responseText);
    };

    // Signup Form error handling
    $('#signupForm').submit(function(event) {
      event.preventDefault(); // Prevent default form submission
      
      $.ajax({
          url: $(this).attr('action'),
          type: $(this).attr('method'),
          data: $(this).serialize(),
          success: function(response) {
              if (response.success) {
                  // Display success message in modal
                  $('#modalError')
                      .text('Su cuenta ha sido creada')
                      .css('background-color', '#09a70e7a' )
                      .show(); // Show the modal error
                  setTimeout(function() {
                      window.location.href = '/'; // Hide the modal after 2 seconds
                  }, 2000); // 2000 milliseconds = 2 seconds
              } else if (response.errors) {
                  // Display errors in modal
                  handleError(response.errors);
              }
          },
          error: function(xhr, status, error) {
              handleAjaxError(xhr);
          }
      });
    });


    // SVG BEHAVIOR
    const svgContainer = document.querySelector(".svg-container");
    
    // JavaScript to cycle through the SVGs
    let currentIndex = 0;
    const svgItems = document.querySelectorAll('.svg-item');

    // Function to change the displayed SVG
    function changeSVG() {
        svgItems.forEach((item, index) => {
            item.style.display = index === currentIndex ? 'block' : 'none';
        });

        currentIndex = (currentIndex + 1) % svgItems.length;
    }

    // Change the SVG every 3 seconds
    setInterval(changeSVG, 8000);

    // Initial display setup
    changeSVG();

    // Show content with a fade-in effect
    setTimeout(function() {
        svgContainer.classList.add("show");
    }, 500); // Adjust delay as needed

});