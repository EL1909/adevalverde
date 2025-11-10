function updateOrderStatus(paypalOrderId, orderId, status) {
    fetch('/store/orders/manage_order/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            paypal_order_id: paypalOrderId,
            order_id: orderId,
            payment_status: status,
            shipping_data: {} // not needed for status update
        })
    })
    .then(r => r.json())
    .then(data => {
        console.log('Status updated:', data);
        alert(`Order #${orderId} is now ${status.toUpperCase()}!`);
        location.reload(); // or update UI dynamically
    })
    .catch(err => {
        console.error('Update failed:', err);
        alert('Failed to update status.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 0. CSRF token – always present in Django forms
    // -----------------------------------------------------------------
    const csrfTokenEl = document.querySelector('input[name="csrfmiddlewaretoken"]');
    const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';

    // -----------------------------------------------------------------
    // 1. Product Add Form – toggle download file
    // -----------------------------------------------------------------
    const downloadableCheckbox = document.getElementById('id_is_downloadable');
    const fileSection = document.getElementById('download-file-section');

    const toggleFileInput = () => {
        if (!downloadableCheckbox || !fileSection) return;
        const fileInput = fileSection.querySelector('input[type="file"]');
        if (downloadableCheckbox.checked) {
            fileSection.style.display = 'block';
            fileInput?.setAttribute('required', 'required');
        } else {
            fileSection.style.display = 'none';
            fileInput?.removeAttribute('required');
        }
    };
    downloadableCheckbox?.addEventListener('change', toggleFileInput);
    toggleFileInput();                     // run on page load

    // -----------------------------------------------------------------
    // 2. Add to Cart (all .add-to-cart-form)
    // -----------------------------------------------------------------
    document.querySelectorAll('.add-to-cart-form').forEach(form => {
        form.addEventListener('submit', e => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const productId = submitBtn?.dataset.productId;
            const url = form.action;

            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(r => r.json())
            .then(data => {
                console.log('Added:', data.message);

                const badge = document.getElementById('cart-total-count');
                if (badge && data.cart_count !== undefined) {
                    badge.textContent = data.cart_count;
                    badge.classList.toggle('d-none', data.cart_count === 0);
                }
                alert('¡Producto añadido al carrito!');
            })
            .catch(err => console.error('Add to cart error:', err));
        });
    });

    // -----------------------------------------------------------------
    // 3. Remove Item from Cart
    // -----------------------------------------------------------------
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();

            const productId = btn.dataset.productId;
            const url = `/store/cart/cart_remove/${productId}/`;

            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;

                // 1. Remove the line item
                document.getElementById(`item-${productId}`)?.remove();

                // 2. Update total price
                const totalEl = document.getElementById('cart-total');
                if (totalEl) totalEl.textContent = `$${data.total_price}`;

                // 3. Update cart count badge
                const countEl = document.getElementById('cart-count');
                if (countEl) countEl.textContent = data.cart_count;

                alert('Producto eliminado');
            })
            .catch(err => console.error('Remove error:', err));
        });
    });

    // -----------------------------------------------------------------
    // 4. Checkout – Proceed to Pay (skip shipping for digital-only)
    // -----------------------------------------------------------------
    const proceedBtn = document.getElementById('proceed_to_pay');
    const shippingForm = document.querySelector('#envio form');
    const orderIdEl = document.getElementById('order_id');
    const orderId = orderIdEl?.dataset.orderId || sessionStorage.getItem('order_id');

    if (orderId) sessionStorage.setItem('order_id', orderId);

    proceedBtn?.addEventListener('click', e => {
        e.preventDefault();

        const hasPhysical = proceedBtn.dataset.hasPhysical === 'true';
        console.log('Has physical:', hasPhysical, 'Order ID:', orderId);

        // ---- shipping validation (only when physical items exist) ----
        if (hasPhysical && shippingForm) {
            const required = shippingForm.querySelectorAll('input[required]');
            let allFilled = true;

            required.forEach(f => {
                if (!f.value.trim()) {
                    allFilled = false;
                    f.classList.add('is-invalid');
                } else {
                    f.classList.remove('is-invalid');
                }
            });

            if (!allFilled) {
                alert('Por favor completa los datos de envío.');
                return;
            }
        }

        if (!orderId) {
            alert('El carrito está vacío.');
            return;
        }

        const totalText = document.getElementById('cart-total')?.textContent || 'Total: $0';
        const totalAmount = parseFloat(totalText.replace('Total: $', '').trim());
        if (isNaN(totalAmount) || totalAmount <= 0) {
            alert('Monto inválido.');
            return;
        }

        const container = document.getElementById('paypal-button-container');
        if (container) container.style.display = 'block';
        initPayPalButtons(totalAmount);
    });

    // -----------------------------------------------------------------
    // 5. PayPal Buttons
    // -----------------------------------------------------------------
    const initPayPalButtons = totalAmount => {
        if (typeof paypal === 'undefined') {
            console.error('PayPal SDK not loaded');
            alert('PayPal no está disponible. Recarga la página.');
            return;
        }

        const container = document.getElementById('paypal-button-container');
        if (!container) return;
        container.innerHTML = '';

        paypal.Buttons({
            createOrder: (data, actions) => actions.order.create({
                purchase_units: [{
                    amount: { currency_code: 'USD', value: totalAmount.toFixed(2) }
                }]
            }),
            onApprove: (data, actions) => actions.order.capture()
                .then(details => {
                    console.log('Pago por:', details.payer.name.given_name);
                    updateOrderStatus(data.orderID, orderId, 'completed');
                }),
            onError: err => {
                console.error('PayPal error:', err);
                updateOrderStatus(null, orderId, 'failed');
            }
        }).render('#paypal-button-container');
    };

    // -----------------------------------------------------------------
    // 6. Update Order Status (after PayPal)
    // -----------------------------------------------------------------
    const updateOrderStatus = (paypalOrderId, orderId, status) => {
        const shippingData = JSON.parse(sessionStorage.getItem('shippingData') || '{}');

        fetch('/store/orders/manage_order/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                paypal_order_id: paypalOrderId,
                order_id: orderId,
                payment_status: status,
                shipping_data: shippingData
            })
        })
        .then(r => r.json())
        .then(data => {
            console.log('Order updated:', data);
            if (status === 'completed') {
                alert('¡Pago completado!');
                sessionStorage.clear();
            } else {
                alert('Pago fallido.');
            }
        })
        .catch(err => {
            console.error('Update error:', err);
            alert('Error al procesar el pedido.');
        });
    };

    // -----------------------------------------------------------------
    // 7. Shipping Form – auto-save to sessionStorage
    // -----------------------------------------------------------------
    if (shippingForm) {
        const saveShipping = () => {
            const data = {
                name:    document.getElementById('name')?.value    || '',
                email:   document.getElementById('email')?.value   || '',
                address: document.getElementById('address')?.value || '',
                city:    document.getElementById('city')?.value    || '',
                zipcode: document.getElementById('zipcode')?.value || '',
                country: document.getElementById('country')?.value || ''
            };
            sessionStorage.setItem('shippingData', JSON.stringify(data));
        };

        shippingForm.addEventListener('input', saveShipping);

        // Load previously saved data
        const saved = JSON.parse(sessionStorage.getItem('shippingData') || '{}');
        Object.keys(saved).forEach(k => {
            const el = document.getElementById(k);
            if (el) el.value = saved[k];
        });
    }

    // -----------------------------------------------------------------
    // 8. Inventory – product details panel
    // -----------------------------------------------------------------
    document.querySelectorAll('.warehouse-item').forEach(row => {
        row.addEventListener('click', () => {
            document.querySelectorAll('.warehouse-item')
                    .forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');

            const productId = row.dataset.productId;
            const detailsPane = document.getElementById('warehouse-details');
            if (detailsPane) detailsPane.classList.remove('d-none');

            const nameEl = document.getElementById('product-name-display');
            if (nameEl) nameEl.textContent = 'Cargando...';

            fetch(`/store/products/product/${productId}/details/api/`)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(data => {
                    document.getElementById('product-id-display').textContent = data.id;
                    document.getElementById('product-name-display').textContent = data.name || 'N/A';
                    document.getElementById('product-category-display').textContent = data.category_name || 'N/A';
                    document.getElementById('product-price-display').textContent = `$${data.price?.toFixed(2)}`;
                    document.getElementById('product-description-display').textContent = data.description || 'N/A';

                    const link = document.getElementById('product-link-display');
                    if (link) {
                        if (data.external_link) {
                            link.href = data.external_link;
                            link.textContent = 'Ver Link';
                        } else {
                            link.href = '#';
                            link.textContent = 'N/A';
                        }
                    }

                    document.getElementById('edit-product-btn').href = row.dataset.editUrl;
                    document.getElementById('delete-product-btn').href = row.dataset.deleteUrl;
                })
                .catch(err => {
                    console.error('Fetch error:', err);
                    if (nameEl) nameEl.textContent = 'Error cargando';
                });
        });
    });

    // -----------------------------------------------------------------
    // 9. Orders – tab switching
    // -----------------------------------------------------------------
    const openTab = document.getElementById('openOrders-tab');
    const closedTab = document.getElementById('closedOrders-tab');

    openTab?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('openOrders-list').classList.add('active');
        document.getElementById('closedOrders-list').classList.remove('active');
        e.target.classList.add('active');
        closedTab?.classList.remove('active');
    });

    closedTab?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('closedOrders-list').classList.add('active');
        document.getElementById('openOrders-list').classList.remove('active');
        e.target.classList.add('active');
        openTab?.classList.remove('active');
    });

    // -----------------------------------------------------------------
    // 10. Order Details Panel
    // -----------------------------------------------------------------
    document.querySelectorAll('.order-item').forEach(row => {
        row.addEventListener('click', () => {
            const details = document.getElementById('order-details');
            const orderId = row.dataset.order_id;
            const currentStatus = row.dataset.paymentstatus;

            // static fields
            document.querySelector('#order-details .order-id-display').textContent = orderId;
            document.querySelector('#order-details .total-price-display').textContent = `$${row.dataset.totalamount}`;
            document.querySelector('#order-details .status-display').textContent = row.dataset.paymentstatus;
            document.querySelector('#order-details .user-id-display').textContent = row.dataset.user;
            document.querySelector('#order-details .created-display').textContent = row.dataset.created_at;
            document.querySelector('#order-details .updated-display').textContent = row.dataset.updated_at;

            // === Set current status in dropdown ===
            const statusSelect = document.getElementById('order-status-select');
            if (statusSelect) {
                statusSelect.value = currentStatus;
            }

            // shipping
            let shipping = { name:'N/A', email:'N/A', address:'N/A', city:'N/A', zipcode:'N/A' };
            try { shipping = JSON.parse(row.dataset.shipping); } catch (_) {}
            document.querySelector('.shipping-name-display').textContent = shipping.name;
            document.querySelector('.shipping-email-display').textContent = shipping.email;
            document.querySelector('.shipping-address-display').textContent = shipping.address;
            document.querySelector('.shipping-city-display').textContent = shipping.city;
            document.querySelector('.shipping-zipcode-display').textContent = shipping.zipcode;

            // items list
            const itemsList = document.getElementById('order-items');
            itemsList.innerHTML = '<li>Cargando...</li>';

            fetch(`/store/orders/order/${orderId}/items/`)
                .then(r => r.json())
                .then(data => {
                    itemsList.innerHTML = '';
                    if (data.error) {
                        itemsList.innerHTML = '<li>Error</li>';
                        return;
                    }
                    data.items.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'd-flex justify-content-between py-1';
                        li.innerHTML = `
                            <span>${item.product__name} x ${item.quantity}</span>
                            <span class="fw-bold">$${(item.quantity * item.price).toFixed(2)}</span>
                        `;
                        itemsList.appendChild(li);
                    });
                })
                .catch(() => { itemsList.innerHTML = '<li>Error</li>'; });

            details.classList.toggle('d-none');

            // === Update button click ===
            const updateBtn = document.getElementById('update_order');
            if (updateBtn) {
                updateBtn.onclick = (e) => {
                    e.preventDefault();
                    const newStatus = statusSelect.value;

                    if (confirm(`Change order #${orderId} to "${newStatus}"?`)) {
                        updateOrderStatus(null, orderId, newStatus);
                    }
                };
            }
        });
    });

    // -----------------------------------------------------------------
    // 11. Cart – click item → show #selected-item (AJAX)
    // -----------------------------------------------------------------
    document.querySelectorAll('#cart-items .ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.dataset.id;
            const selectedPanel = document.getElementById('selected-item');
            const homeDetail = document.getElementById('home-detail');

            selectedPanel?.classList.remove('d-none');
            homeDetail?.classList.add('d-none');

            const nameEl = document.getElementById('selected-product-name');
            if (nameEl) nameEl.textContent = 'Cargando...';

            fetch(`/store/products/product/${productId}/details/api/`)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(data => {
                    if (nameEl) nameEl.textContent = data.name;
                    document.getElementById('selected-product-price').textContent = `$${data.price}`;
                    document.getElementById('selected-product-quantity').value =
                        item.querySelector('.product-units').textContent.replace('x', '').trim();

                    document.getElementById('update-quantity-form').action = `/store/cart/update/${productId}/`;
                    document.getElementById('remove-product-link').href = `/store/cart/remove/${productId}/`;
                    document.getElementById('selected-product-link').href = `/store/product/${productId}/`;
                    const img = document.getElementById('selected-product-image');
                    if (img) {
                        img.src = data.image;
                        img.alt = data.name;
                    }
                })
                .catch(err => {
                    console.error('Error loading product:', err);
                    if (nameEl) nameEl.textContent = 'Error al cargar';
                });
        });
    });

    // -----------------------------------------------------------------
    // 12. Categories - 
    // -----------------------------------------------------------------

    // CATEGORIES
    // Selectors
    var warehouseDetailsPane = document.getElementById('warehouse-details');
    var ordersDetailsPane = document.getElementById('order-details');
    var categoryDetailsPane = document.getElementById('category-details');
    var addCategory = document.getElementById('add-category');
    var selectedCategory = document.getElementById('selected-category');
    const categoryRows = document.querySelectorAll('.category-item');

    // Handle "Crear categoria" button to reset form
    document.getElementById('show-add-category').addEventListener('click', function(e) {
        e.preventDefault();
        const catform = addCategory.querySelector('form');
        
        // Reset form for new category
        catform.querySelector('input[name="name"]').value = '';
        catform.querySelector('textarea[name="description"]').value = '';
        catform.action = `/store/category/add/`;
        
        // Show the add-category form
        categoryDetailsPane.classList.remove('d-none');
        addCategory.classList.remove('d-none');
    });

    function populateCategoryDetails(clickedElement) {
        // 1. Clear selection from all warehouse rows and mark the current one
        categoryRows.forEach(row => {
            row.classList.remove('selected');
        });
        clickedElement.classList.add('selected');

        // 2. Get Data (ID and URLs from the row's data attributes)
        const categoryId = clickedElement.dataset.categoryId;
        const editCategoryUrl = clickedElement.dataset.editUrl;
        const deleteCategoryUrl = clickedElement.dataset.deleteUrl;

        ordersDetailsPane.classList.add('d-none');
        warehouseDetailsPane.classList.add('d-none');
        categoryDetailsPane.classList.remove('d-none');

        // Temporarily indicate loading on the Name field
        document.getElementById('category-name-display').textContent = 'Cargando...';

        // 3. Fetch Category's Data via AJAX
        fetch(`/store/category/${categoryId}/details/api/`) 
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: Failed to fetch product details.`);
                }
                return response.json();
            })
            .then(data => {         
                // Update text content fields
                document.getElementById('category-id-display').textContent = data.id || 'N/A';
                document.getElementById('category-name-display').textContent = data.name || 'N/A';
                document.getElementById('category-description-display').textContent = data.description || 'N/A';
                // Update Action Buttons
                document.getElementById('edit-category-btn').href = editCategoryUrl;
                document.getElementById('delete-category-btn').href = deleteCategoryUrl;

            })
            .catch(error => {
            // On error, only update the main field and console log the message
            console.error('Error fetching product details:', error);
            document.getElementById('category-name-display').textContent = `ERROR: ${error.message}`;
            document.getElementById('category-description-display').textContent = '';
            });
    }

    // Attach Event Listener ---
    categoryRows.forEach(row => {
        row.addEventListener('click', function() {
            populateCategoryDetails(this); 
        });
    });

    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent page refresh
            e.stopPropagation(); // Stop event bubbling
            const categoryId = document.getElementById('category-id-display').textContent;
            const categoryName = document.getElementById('category-name-display').textContent;
            const categoryDescription = document.getElementById('category-description-display').textContent || '';
            const form = addCategory.querySelector('form');

            console.log(categoryName);
            
            // Populate form fields
            form.querySelector('input[name="name"]').value = categoryName;
            form.querySelector('textarea[name="description"]').value = categoryDescription;
            
            // Update form action for edit
            form.action = `/store/category/edit/${categoryId}/`;
            
            // Show the add-category form
            addCategory.classList.remove('d-none');
        });
    });

});