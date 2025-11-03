$(function()    {
    let momentId;

    // handle click event on timeline items
    $('.timeline-item').on('click', function() {
        var selectedKeyMoment = $(this);

        // Update the image and description in the first two columns
        var backgroundImage = selectedKeyMoment.find('img').attr('src');
        var description = selectedKeyMoment.find('.moment-description').text();
        var title = selectedKeyMoment.find('h4').text();
        var excerpt = selectedKeyMoment.find('.moment-excerpt').text();

        // Update the content and image of the divs
        $('#key-moment-image').css('background-image', 'url(' + backgroundImage + ')');
        $('#key-moment-description').text(description);
        $('#key-moment-title').text(title);
        $('#key-moment-excerpt').text(excerpt);
    
        // Add active class to the selected timeline item
        $('.timeline-item').removeClass('active');
        selectedKeyMoment.addClass('active');
    });

    // handle click event on the "Create New Moment" button
    $('#create-new-moment').on('click', function(event) {
        event.preventDefault();
        $('#editing-mode').val('0');
        var modal = $('#create-moment-modal');
        if (modal.length) {
            modal.modal('show');
        } else {
            console.error('Modal with ID "create-moment-modal" not found.');
        }
    });

    // Handle click event in the "Edit" button
    $('.edit-moment').on('click', function(event) {
        event.preventDefault();
        // Set editing mode in modal
        $('#editing-mode').val(1);
        momentId = $(this).data('moment-id');
        console.log('Clicked Edit. Moment ID:', momentId); // Add this line for debugging
        // Store the momentId as data attribute in the form for submission
        $('#new-moment-form').attr('data-moment-id', momentId);
        // Open the modal with the edit form
        $('#create-moment-modal').modal('show');
        // Fetch existing moment data via AJAX and pre-populate the form
        $.ajax({
            type: 'GET',
            url: '/keymoments/edit/' + momentId + '/',
            success: function(response) {
                // Pre-populate form fields with fetched data
                $('#title').val(response.title);
                $('#excerpt').val(response.excerpt);
                $('#description').val(response.description);
                $('#start_date').val(response.start_date);
                $('#end_date').val(response.end_date);
                $('#moment_type').val(response.moment_type);
                $('#location').val(response.location);
                // Populate the image input field with the image data
                if (response.image_data) {
                    $('#image').val(response.image_data);
                }
                // Initialize Cropper to edit the image 
                initializeCropper(response.image_url);
            },
            error: function(error) {
                console.log('Error fetching moment data for editing');
            }
        });
    });

    // Activate Cropper.js
    var cropper;
    function initializeCropper(imageDataURL)    {
        if (cropper)    {
            cropper.destroy();
        }

        $('#cropper-image').attr('src', imageDataURL).show();

        cropper = new Cropper(document.getElementById('cropper-image'), {
            aspectRatio: 1,
            cropBoxData: {
                width:380,
                height:120,
            },
            viewMode:2, // Allow cropping within the container without extending beyond
            zoomable: true,
        });
    }

    // Handle file input change event to initialize the Cropper.js instance
    $('#moment_image').on('change', function(event) {
        var input = event.target;
        // Ensure that a file is selected
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            // Read the selected file as data URL
            reader.onload = function() {
                var imageDataURL = reader.result;
                initializeCropper(imageDataURL);
            };

            // Start reading the file
            reader.readAsDataURL(input.files[0]);
        } else {
            // If no file is selected, destroy the existing Cropper instance
            if (cropper) {
                cropper.destroy();
            }
        }
    });

    // handle form submission for New and Edit
    $('#new-moment-form').on('submit', function(event) {
        event.preventDefault();
        var editingMode = $('#editing-mode').val();
        var formData = new FormData();
        if (editingMode === '1') {       
            // Update fields to the form data object
            momentId = $('#new-moment-form').attr('data-moment-id');// Get the moment ID
            formData.append('title', $('#title').val());
            formData.append('excerpt', $('#excerpt').val());
            formData.append('description', $('#description').val());
            formData.append('start_date', $('#start_date').val());
            formData.append('end_date', $('#end_date').val());
            formData.append('moment_type', $('#moment_type').val());
            formData.append('location', $('#location').val());
            formData.append('status', '1');  
            // Get the cropped image data URL from Cropper.js
            var croppedImageDataURL = cropper.getCroppedCanvas().toDataURL();
            // Convert the data URL to a Blob object (file)
            var croppedImageFile = dataURLtoBlob(croppedImageDataURL);
            // Append the cropped image file to the FormData object
            formData.append('image', croppedImageFile, 'cropped_image.jpg');
            // Log the FormData contents for debugging
            for (var pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
                console.log(typeof croppedImageFile);
            }
            // Send the form data to the server to update the moment
            var csrftoken = $('[name=csrfmiddlewaretoken]').val();
            $.ajax({
                headers: {
                    "X-CSRFToken": csrftoken
                },
                    type: 'POST',
                    url: '/keymoments/edit/' + momentId + '/',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        // Handle the success response (update UI or close modal)
                        // Close the modal or navigate back to the timeline page
                    $('#create-moment-modal').modal('hide');
                    // Reset the form fields for the next moment creation
                    $('#new-moment-form')[0].reset();
                    location.reload();
                    },
                    error: function(error) {
                        // Handle any errors that may occur during form submission
                        console.log("Error en carga de datos");
                        console.log(error.responseText);
                    }
            });
        } else {
            // Create a new FormData object
            var formData = new FormData();
            // Update fields to the form data object
            formData.append('title', $('#title').val());
            formData.append('excerpt', $('#excerpt').val());
            formData.append('description', $('#description').val());
            formData.append('start_date', $('#start_date').val());
            formData.append('end_date', $('#end_date').val());
            formData.append('moment_type', $('#moment_type').val());
            formData.append('location', $('#location').val());
            // Check the checkbox state and set status accordingly
            var statusValue = $('#status').prop('checked') ? 0 : 1;
            formData.append('status', statusValue.toString());
            // Get the cropped image data URL from Cropper.js
            var croppedImageDataURL = cropper.getCroppedCanvas().toDataURL();
            // Convert the data URL to a Blob object (file)
            var croppedImageFile = dataURLtoBlob(croppedImageDataURL);
            // Append the cropped image file to the FormData object
            formData.append('image', croppedImageFile, 'cropped_image.jpg');
            // Log the FormData contents for debugging
            for (var pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
                console.log(typeof croppedImageFile);
            }
            // Send the form data to the server to create the new moment
            var csrftoken = $('[name=csrfmiddlewaretoken]').val();
            $.ajax({
                headers: {
                    "X-CSRFToken": csrftoken
                },
                type: 'POST',
                url: '/keymoments/create_key_moment/',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    // On success, update the timeline with the new moment HTML
                    var newMomentHTML = 
                    '<div class="timeline-item" data-dates="' + response.start_date + '">'
                        + '<a href="#">'
                        + '<h4>' + response.title + '</h4>'
                        + '<p class="moment-excerpt">' + response.excerpt + '</p>'
                        + '<p class="moment-description" style="display: none;">' + response.description + '</p>'
                        + '<img src="' + response.image_url + '" alt="' + response.title + '" style="display: none;">'
                        + '</a>'
                    + '</div>';
                    $('.history-items').append(newMomentHTML);
                    // Close the modal or navigate back to the timeline page
                    $('#create-moment-modal').modal('hide');
                    // Reset the form fields for the next moment creation
                    $('#new-moment-form')[0].reset();
                    location.reload();
                },
                error: function(error) {
                    // Handle any errors that may occur during form submission
                    console.log ("Error en carga de datos")
                    console.log(error.responseText);
                }
            });
        }
    });

    // Function to convert data URL to Blob
    function dataURLtoBlob(dataURL) {
        console.log(dataURL);
        var arr = dataURL.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // Handle action on "Delete" link for key moments
    $('.delete-moment').on('click', function(event) {
        event.preventDefault();

        if (confirm("Confirme para eliminar"))  {
            momentId = $(this).data('moment-id');

            $.ajax({
                type: 'POST',
                url: '/keymoments/delete/'+ momentId + '/',
                data: {
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
                    delete: 1,
                },
                success: function(response) {
                    $('.timeline-item[data-moment-id="'+ momentId + '"]').remove();
                    location.reload();
                },
                error: function()   {
                    // handle error
                }
            });
        }
    });

    // Handle action on "Delete" link for Products
    const deleteLink = document.getElementById('delete-product-link');
            if (deleteLink) {
                deleteLink.addEventListener('click', function(event) {
                    event.preventDefault(); // Prevent the default link behavior
                    const confirmation = confirm('Are you sure you want to delete this product?');
                    if (confirmation) {
                        // If the user confirms, navigate to the delete view
                        window.location.href = this.getAttribute('href');
                    }
                });
            }
});