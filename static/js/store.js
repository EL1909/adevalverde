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
                console.log("Order Id:", data.order_id);
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
            const url = 'store/cart/cart_remove/' + productId;
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

    // Call Paypal Buttons and Update Order
    $(document).ready(function() {
        var shippingForm = $('#envio form');
        var sessionData = sessionStorage.getItem('shippingData') ? JSON.parse(sessionStorage.getItem('shippingData')) : {};
        var order_id = document.getElementById('order_id').getAttribute('data-order-id');

        if (order_id)   {
            sessionStorage.setItem('order_id', order_id)
        }

        // Debugging step: Log session data and order_id
        console.log("Session Data:", sessionData);
        console.log("Order ID from sessionStorage:", order_id);

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
            // Log shipping data from sessionStorage
            console.log("Shipping Data:", sessionData);
            console.log("Order Id:", order_id);
    
            // Verify if shippingForm is completed
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
                    alert('Por favor verifique los datos para el envío.');
                    return;
                }
            }
    
            if (!order_id) {
                alert('El carrito esta vacio.');
                return;
            }
    
            // Calculate TotalAmount
            var totalAmount = parseFloat($('#cart-total').text().replace('Total: $', ''));
            if (isNaN(totalAmount)) {
                alert('Error al calcular el monto total.');
                return;
            }

            console.log("Amount:", totalAmount);
    
            $('#paypal-button-container').show();
            initPayPalButtons(order_id);
        });
    
        // Call PayPal Buttons
        function initPayPalButtons(totalAmount) {
            $('#paypal-button-container').empty();
            paypal.Buttons({
                createOrder: function (data, actions) {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                currency_code: 'USD',
                                value: totalAmount,
                            }
                        }]
                    });
                },
                onApprove: function (data, actions) {
                    return actions.order.capture().then(function(details) {
                        console.log("Pago completado por " + details.payer.name.given_name);
                        updateOrder(data.orderId, order_id, 'completed');
                    });
                },
                onError: function(err) {
                    console.error(err);
                    updateOrder(null, order_id, 'failed');
                    alert('Hubo un error al procesar el pago. Por favor, intenta de nuevo.');
                }
            }).render('#paypal-button-container');
        }
    
        // Function to update order status via AJAX
        function updateOrder(paypalOrderId, order_id, status) {
            let postData = {
                'paypal_order_id': paypalOrderId || null,
                'order_id': order_id,
                'payment_status': status
            };
    
            $.ajax({
                type: 'POST',
                url: '/store/orders/manage_order/',
                headers: {
                    'X-CSRFToken': $('[name=csrfmiddlewaretoken]').val()
                },
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(postData),
                dataType: 'json',
                success: function(response) {
                    console.log('Estado del pedido actualizado:', response);
                    if (status === 'completed') {
                        alert('¡Pago completado con éxito!');
                        // Optionally redirect or update UI
                    } else {
                        alert('El pago ha fallado. Por favor, intenta de nuevo o elige otro método de pago.');
                    }
                },
                error: function(error) {
                    console.error('Error al actualizar el estado del pedido:', error);
                    alert('Ocurrió un error al actualizar el estado del pedido. Por favor, intenta de nuevo.');
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