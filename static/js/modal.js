$(document).ready(function() {

    // Get the login modal link element by its id
    var loginModalLink = document.getElementById("loginModalLink");

    
    // Add a click event listener to the link
    loginModalLink?.addEventListener("click", function (event) {
        // Prevent the default behavior of the link (e.g., navigating to another page)
        event.preventDefault();
    
        // Get the modal element by its id
        var modal = document.getElementById("loginModal");
        
        // Prevent opening multiple instances
        if (modal.classList.contains('show')) {
            return;
        }
    
        // Use Bootstrap's modal API to show the modal (getOrCreateInstance avoids duplicates)
        var modalInstance = bootstrap.Modal.getOrCreateInstance(modal);
        modalInstance.show();
    });


    // Login Form error handling
    // DISABLED: Allauth handles form submission directly
    /*
    $('#loginForm').submit(function(event) {
        event.preventDefault(); // Prevent default form submission
        
        $.ajax({
            url: $(this).attr('action'),
            type: $(this).attr('method'),
            data: $(this).serialize(),
            success: function(response) {
                if (response.success) {
                    // Show success message and redirect after delay
                    $('#modalError')
                        .text('Conectado')
                        .css('background-color', '#09a70e7a')
                        .show();
                    setTimeout(function() {
                        window.location.href = '/';
                    }, 2500);
                } else if (response.errors) {
                    // Display errors in modal
                    handleError(response.errors);
                }
            },
            error: function(xhr) {
                handleAjaxError(xhr);
            }
        });
    });
    */


    // Function to handle signup or login errors
    function handleError(errors) {
        let errorMessage = '<ul>';
        try {
            // Handle errors in various formats
            if (typeof errors === 'string') {
                errorMessage += `<li>${errors}</li>`;
            } else if (Array.isArray(errors)) {
                errors.forEach(err => errorMessage += `<li>${err}</li>`);
            } else if (typeof errors === 'object') {
                Object.keys(errors).forEach(field => {
                    const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
                    fieldErrors.forEach(err => errorMessage += `<li>${field}: ${err}</li>`);
                });
            } else {
                errorMessage += '<li>An unexpected error occurred.</li>';
            }
        } catch (e) {
            console.error('Error processing errors:', e);
            errorMessage += '<li>An unexpected error occurred.</li>';
        }
        errorMessage += '</ul>';
        $('#modalError')
            .html(errorMessage)
            .css('background-color', '#a7092b7a')
            .show();
    };
    

    // Function to handle AJAX error responses
    function handleAjaxError(xhr) {
        let errorMessage = '<ul><li>Error: ';
        try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            if (response.errors) {
                handleError(response.errors);
                return;
            }
            errorMessage += response.message || xhr.statusText || 'Unknown error occurred.';
        } catch (e) {
            errorMessage += xhr.statusText || xhr.responseText || 'Unknown error occurred.';
        }
        errorMessage += '</li></ul>';
        $('#modalError')
            .html(errorMessage)
            .css('background-color', '#a7092b7a')
            .show();
        console.error('AJAX error:', xhr.responseText);
    };


    // Signup Form error handling
    // DISABLED: Allauth handles form submission directly
    /*
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
                        window.location.href = response.redirect_url; // Hide the modal after 2 seconds
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
    */

   

});

