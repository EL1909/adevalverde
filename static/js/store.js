document.addEventListener('DOMContentLoaded', (event) => {
    let csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

    // CART
    // Add item to cart behavior
    document.querySelectorAll('.add-to-cart-form').forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();  // Prevent form from submitting traditionally
            // Get the URL from the href
            const url = form.action;
            const productId = form.querySelector('button').getAttribute('data-product-id');

            fetch(url, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                    product_id: productId
                })
            })
            .then(response => response.json())
            .then(data => {
                // Log the message sent from the view to the console
                console.log(data.message);  // This will print the message, e.g., "Product added to cart!"

                // Optionally update other parts of the page, like cart count
                alert("Product added to cart!");  // This can be a temporary message for feedback
            })
            .catch(error => console.log('Error:', error));
        });
    });


    // Delete item from cart behavior
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            const url = this.getAttribute('href');
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Item removed from cart!');
                    // Update cart display dynamically
                    document.querySelector(`#item-${productId}`).remove();
                    document.querySelector('#cart-total').textContent = `$${data.total_price}`;
                    document.querySelector('#cart-count').textContent = data.cart_count;
                } else {
                    alert('Failed to remove item.');
                }
            })
            .catch(error => console.error('Error:', error));
        });
    });


    // Product info within shoppingCart
    document.querySelectorAll('#cart-items .ticket-item').forEach((item) => {
        item.addEventListener('click', function () {
            console.log('Item clicked:', this);
            // Retrieve data from the clicked item's attributes
            const productName = this.getAttribute('data-name');
            const productPrice = this.getAttribute('data-price');
            const productUnits = this.getAttribute('data-quantity');
            const productImage = this.getAttribute('data-image');
            const productId = this.getAttribute('data-id');
        
            // Show #selected-item and hide #home-detail
            document.getElementById('selected-item').classList.remove('d-none');
            document.getElementById('home-detail').classList.add('d-none');
        
            // Update relevant elements in #selected-item
            document.getElementById('selected-product-name').textContent = productName;
            document.getElementById('selected-product-price').textContent = `$${productPrice}`;
            document.getElementById('selected-product-quantity').value = productUnits;
            document.getElementById('update-quantity-form').action = '/store/cart/update/' + productId + '/';
            document.getElementById('remove-product-link').href = '/store/cart/clear/';
            document.getElementById('selected-product-link').href = '/store/product/' + productId + '/' ;
            document.getElementById('selected-product-image').src = productImage;
            document.getElementById('selected-product-image').alt = productName;
        });
    });


    // Show Paypal Button
    $(document).ready(function() {
        var shippingForm = $('#envio form');
        var sessionData = sessionStorage.getItem('shippingData') ? JSON.parse(sessionStorage.getItem('shippingData')) : {};
        let orderId;



        // Function to save shipping data to session
        function saveToSession(formData) {
            sessionStorage.setItem('shippingData', JSON.stringify(formData));
        }

        // If the form exists, listen for changes
        if (shippingForm.length) {
            shippingForm.on('change', function() {
                var formData = {
                    'name': $('#name').val(),
                    'email': $('#email').val(),
                    'address': $('#address').val(),
                    'city': $('#city').val(),
                    'zipcode': $('#zipcode').val(),
                    'country': $('#country').val()
                };
                saveToSession(formData);
            });

            // On page load, if data exists in session, fill the form
            if (Object.keys(sessionData).length > 0) {
                $('#name').val(sessionData.name || '');
                $('#email').val(sessionData.email || '');
                $('#address').val(sessionData.address || '');
                $('#city').val(sessionData.city || '');
                $('#zipcode').val(sessionData.zipcode || '');
                $('#country').val(sessionData.country || '');
            }
        }

        $('#proceed_to_pay').on('click', function(event) {
            event.preventDefault();

            // Gather cart data
            var cartItems = [];
            $('#cart-items li').each(function() {
                var item = {
                    'product_id': $(this).data('id'),
                    'name': $(this).data('name'),
                    'price': $(this).data('price'),
                    'quantity': $(this).data('quantity')
                };
                cartItems.push(item);
            });

            // Check if cart has items
            if (cartItems.length === 0) {
                alert('El carrito esta vacio.');
                return;
            }

            // Gather user data
            var userData = {};
            if (shippingForm.length) {
                var requiredFields = shippingForm.find('input[required]');
                var allFilled = true;

                requiredFields.each(function() {
                    if ($(this).val().trim() === '') {
                        allFilled = false;
                        $(this).addClass('is-invalid'); // Add visual feedback for empty fields
                    } else {
                        $(this).removeClass('is-invalid');
                    }
                });

                if (!allFilled) {
                    alert('Por favor verifique los datos para el envio.');
                    return;
                }

                userData = sessionData; // Use session data for the form
            } else {
                // If user is logged in, you might fetch this data from another part of the page or directly from user object
                userData = {
                    'name': '{{ user.first_name }} {{ user.last_name }}',
                    'email': '{{ user.email }}',
                    'address': '{{ user.profile.address }}',
                    'city': '{{ user.profile.city }}',
                    'zipcode': '{{ user.profile.zipcode }}',
                    'country': '{{ user.profile.country }}'
                };

                // Check if any of these fields are empty for logged-in users
                if (Object.values(userData).some(value => value === '' || value === undefined)) {
                    alert('Datos del usuario insuficientes. Por favor, completa tu perfil o inicia sesión.');
                    return;
                }
            }

            // Total amount check
            var totalAmount = $('#cart-total').text().replace('Total: $', '');
            if (totalAmount === '' || isNaN(parseFloat(totalAmount))) {
                alert('Error calculating the total amount.');
                return;
            }

            // Combine all data
            var postData = {
                'cart': cartItems,
                'user': userData,
                'paymentStatus': 'pending',
                'totalAmount': parseFloat(totalAmount)
            };

            // AJAX request to create order
            $.ajax({
                type: 'POST',
                url: '/products/create_order/',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(postData),
                dataType: 'json',
                success: function(response) {
                    console.log('Order created successfully:', response);
                    orderId = response.order_id;
                    if (shipmentDataExists) {
                        document.getElementById('paypal-button-container').style.display = 'block';
                        initPayPalButtons(orderId);
                    } else {
                        // If no shipment data, you might want to show a different message or proceed to another checkout method
                        alert('La orden ha sido creada, pero no se han proporcionado datos de envío. Por favor, completa los datos de envío para continuar con el pago.');
                    }
                },
                error: function(error) {
                    console.error('Error creating order:', error);
                    alert('An error occurred. Please try again.');
                }
            });
        });


        // Call Paypal Buttons
        function initPayPalButtons(orderId) {
            $('#paypal-button-container').empty();
            paypal.Buttons({
                createOrder: function (data, actions) {
                    // Retrieve total amount from DOM
                    let totalAmount = parseFloat($('#cart-total').text().replace('Total: $', ''));
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                currency_code: 'USD',
                                value: totalAmount.toFixed(2)
                            }
                        }]
                    });
                },
                onApprove: function (data, actions) {
                    return actions.order.capture().then(function(details) {
                        console.log("Payment completed by " + details.payer.name.given_name);
                        // Retrieve session data
                        let sessionData = sessionStorage.getItem('shippingData') ? JSON.parse(sessionStorage.getItem('shippingData')) : {};
                        handlePaymentObject(data.orderID, orderId, 'approved', sessionData, details.purchase_units[0].amount.value);
                    });
                },
                onError: function(err) {
                    console.error(err); 
                    alert('There was an error processing the payment. Please try again.');
                }
            }).render('#paypal-button-container');
        }
        

        // Handle Payment Object
        function handlePaymentObject(paypalOrderId, orderId, paymentStatus, sessionData, amount) {
            let postData = {
                'paypal_order_id': paypalOrderId,
                'order_id': orderId,
                'payment_status': paymentStatus,
                'user': {
                    'name': sessionData.name,
                    'email': sessionData.email,
                    'address': sessionData.address,
                    'city': sessionData.city,
                    'zipcode': sessionData.zipcode,
                    'country': sessionData.country
                },
                'total_amount': amount
            };
        
            $.ajax({
                type: 'POST',
                url: '/products/update_order_payment/',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(postData),
                dataType: 'json',
                success: function(response) {
                    console.log('Payment status updated:', response);
                    if (paymentStatus === 'approved') {
                        alert('Payment completed successfully!');
                        // Optionally redirect or update UI
                    }
                },
                error: function(error) {
                    console.error('Error updating payment status:', error);
                    alert('An error occurred while updating payment status. Please try again.');
                }
            });
        }
    });




    // CATEGORIES
    // Manage Add category button
    document.getElementById('show-add-category').addEventListener('click', function() {
        var addCategory = document.getElementById('add-category');
        if (addCategory.style.display === 'none' || !addCategory.style.display) {
            addCategory.style.display = 'block';
            this.style.display = 'none';

        } else {
            addCategory.style.display = 'none';
            this.style.display = 'block';
        }
    });

    
    // INVENTORY
    //  Add new product to Inventory
    document.querySelector('#addProduct form').addEventListener('submit', function(e) {
        e.preventDefault();
        let formData = new FormData(this);
        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken
            }
        })
        .then(response => response.json())
        .then(data => {
            // Handle the response, maybe clear the form or show a success message
            console.log(data);
        });
    });

    
    
    
    

    
});