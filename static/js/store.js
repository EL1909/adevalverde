// -----------------------------------------------------------------
// 0. CSRF token – always present in Django forms
// -----------------------------------------------------------------
const csrfTokenEl = document.querySelector('input[name="csrfmiddlewaretoken"]');
const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';

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

    // === Tab Handler for inventory_mgm.html ===

    const tabContainer = document.getElementById('storeTabs'); // UL/Padre de los botones de pestaña
    const parentContainerToClean = document.getElementById('invmgm_2'); // Contenedor de detalles

    // Verificación de existencia
    if (tabContainer && parentContainerToClean) {

        // **1. Añadir UN ÚNICO escuchador al contenedor padre de las pestañas.**
        tabContainer.addEventListener('click', function (event) {

            // 2. Determinar si el clic fue en un botón de pestaña (Delegación).
            // Usamos event.target.closest() para encontrar el elemento relevante que activó el evento.
            // Los botones de pestaña típicamente usan la clase 'nav-link' o tienen 'data-bs-toggle'.
            const clickedButton = event.target.closest('[data-bs-toggle="tab"]');

            if (clickedButton) {
                // Prevenir la acción predeterminada si es un enlace, aunque Bootstrap lo maneja
                // event.preventDefault(); 

                // 3. Ocultar todos los divs 'ticket' visibles dentro de #invmgm_2.
                // Esta lógica sigue siendo la misma y es eficiente.
                const visibleContents = parentContainerToClean.querySelectorAll('.ticket:not(.d-none)');

                visibleContents.forEach(contentDiv => {
                    contentDiv.classList.add('d-none');
                    contentDiv.classList.remove('d-block'); // Por si acaso
                });

                // Si la lógica de Bootstrap ya maneja el cambio de pestaña,
                // no necesitas hacer nada más aquí. ¡El trabajo está hecho!
            }
        });
    }

    //  Orders – tab switching
    const openTab = document.getElementById('openOrders-tab');
    const successTab = document.getElementById('successOrders-tab');
    const closedTab = document.getElementById('closedOrders-tab');

    openTab?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('openOrders-list').classList.add('active');
        document.getElementById('successOrders-list').classList.remove('active');
        document.getElementById('closedOrders-list').classList.remove('active');
        e.target.classList.add('active');
        successTab?.classList.remove('active');
        closedTab?.classList.remove('active');
    });

    successTab?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('closedOrders-list').classList.remove('active');
        document.getElementById('successOrders-list').classList.add('active');
        document.getElementById('openOrders-list').classList.remove('active');
        e.target.classList.add('active');
        openTab?.classList.remove('active');
        closedTab?.classList.remove('active');
    });

    closedTab?.addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('closedOrders-list').classList.add('active');
        document.getElementById('openOrders-list').classList.remove('active');
        document.getElementById('successOrders-list').classList.remove('active');
        e.target.classList.add('active');
        openTab?.classList.remove('active');
        successTab?.classList.remove('active');
    });


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
    // 5. PayPal Buttons - Acepta un containerId opcional
    // -----------------------------------------------------------------
    const initPayPalButtons = (totalAmount, containerId = 'paypal-button-container') => {
        if (typeof paypal === 'undefined') {
            console.error('PayPal SDK not loaded');
            alert('PayPal no está disponible. Recarga la página.');
            return;
        }

        // Usa el ID proporcionado o el ID por defecto del checkout
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        // El orderId se sigue tomando de sessionStorage (que actualizaremos justo antes de llamar a esta función)
        const orderId = sessionStorage.getItem('order_id');

        // Es vital que el orderId exista antes de intentar procesar el pago
        if (!orderId) {
            console.error('No order ID available for PayPal transaction.');
            alert('Error: ID de orden no encontrado.');
            return;
        }

        paypal.Buttons({
            createOrder: (data, actions) => actions.order.create({
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: totalAmount.toFixed(2)
                    }
                }]
            }),
            onApprove: (data, actions) => actions.order.capture()
                .then(details => {
                    console.log('Pago por:', details.payer.name.given_name);
                    // Aquí el orderId se obtiene del ámbito de la función que contiene initPayPalButtons
                    updateOrderStatus(data.orderID, orderId, 'completed');
                }),
            onError: err => {
                console.error('PayPal error:', err);
                // Aquí el orderId se obtiene del ámbito de la función que contiene initPayPalButtons
                updateOrderStatus(null, orderId, 'failed');
            }
        }).render(`#${containerId}`); // Renderiza en el contenedor específico
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
                console.log('Order processed response:', data);

                // 1. Manejo del éxito de la llamada POST
                if (data.status === 'completed') {
                    alert('¡Pago completado! Redirigiendo a tus órdenes.');
                    sessionStorage.clear(); // Limpia la sesión del carrito

                    // 2. REDIRECCIÓN DINÁMICA: Usa la URL del backend si está presente
                    if (data.redirect_url) {
                        window.location.href = data.redirect_url;
                    } else {
                        // Fallback: Si el backend no envió la URL (ej: por error de configuración),
                        // usa la URL estática para no dejar al usuario varado.
                        window.location.href = '/store/orders/my-orders/';
                    }

                } else if (data.status === 'failed') {
                    alert('Pago fallido. Por favor, revisa tu estado de órdenes.');
                    // Puedes optar por redirigir a la vista de órdenes para que el usuario vea el estado:
                    window.location.href = '/store/orders/my-orders/';

                } else {
                    // Manejar otros mensajes (como 'error' de la vista ManageOrder)
                    alert('Error en el procesamiento de la orden: ' + (data.error || 'Mensaje desconocido'));
                }
            })
            .catch(error => {
                console.error('Error al comunicarse con ManageOrder:', error);
                alert('Error de conexión o servidor al procesar el pago.');
            });
    };

    // -----------------------------------------------------------------
    // 7. Shipping Form – auto-save to sessionStorage
    // -----------------------------------------------------------------
    if (shippingForm) {
        const saveShipping = () => {
            const data = {
                name: document.getElementById('name')?.value || '',
                email: document.getElementById('email')?.value || '',
                address: document.getElementById('address')?.value || '',
                city: document.getElementById('city')?.value || '',
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
    // 10. Orders – order’s detail panel
    // -----------------------------------------------------------------
    document.querySelectorAll('.order-item').forEach(row => {
        row.addEventListener('click', () => {
            document.querySelectorAll('.order—item')
                .forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');

            const detailsPane = document.getElementById('order-details');
            if (detailsPane) detailsPane.classList.remove('d-none');

            const orderId = row.id;
            const itemsList = document.getElementById('order-items');
            itemsList.innerHTML = '<li>Cargando...</li>';

            fetch(`/store/orders/order/${orderId}/details/api/`)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(data => {
                    document.querySelector('#order-details .order-id-display').textContent = data.id;
                    document.querySelector('#order-details .total-price-display').textContent = `$${data.totalAmount}`;
                    document.querySelector('#order-details .status-display').textContent = data.paymentstatus;
                    document.querySelector('#order-details .user-id-display').textContent = data.user || 'Invitado';
                    document.querySelector('#order-details .created-display').textContent = data.created_at;
                    document.querySelector('#order-details .updated-display').textContent = data.updated_at;

                    if (itemsList) itemsList.textContent = `Detalles de la Orden #${data.id}`;
                    // shipping
                    let shipping = { name: 'N/A', email: 'N/A', address: 'N/A', city: 'N/A', zipcode: 'N/A' };
                    let hasShipping = false;
                    try {
                        const parsed = JSON.parse(data.shipping_data);
                        // Check if parsed data has at least an address or name to consider it valid
                        if (parsed && (parsed.address || parsed.name)) {
                            shipping = parsed;
                            hasShipping = true;
                        }
                    } catch (_) { }

                    const shipmentDetails = document.getElementById('shipment-details');
                    if (shipmentDetails) {
                        if (hasShipping) {
                            shipmentDetails.classList.remove('d-none');
                        } else {
                            shipmentDetails.classList.add('d-none');
                        }
                    }

                    document.querySelector('.shipping-name-display').textContent = shipping.name || 'N/A';
                    document.querySelector('.shipping-email-display').textContent = shipping.email || 'N/A';
                    document.querySelector('.shipping-address-display').textContent = shipping.address || 'N/A';
                    document.querySelector('.shipping-city-display').textContent = shipping.city || 'N/A';
                    document.querySelector('.shipping-zipcode-display').textContent = shipping.zipcode || 'N/A';

                    if (itemsList) {
                        itemsList.innerHTML = '';
                        if (data.items && data.items.length > 0) {
                            data.items.forEach(item => {
                                const li = document.createElement('li');
                                li.className = 'd-flex justify-content-between py-1';
                                const itemTotal = (item.quantity * item.price).toFixed(2);
                                li.innerHTML = `
                                    <span>${item.product_name} x ${item.quantity}</span>
                                    <span class="fw-bold">$${itemTotal}</span>
                                `;
                                itemsList.appendChild(li);
                            });
                        } else {
                            itemsList.innerHTML = `<li>El pedido esta vacio</li>`
                        }
                    }

                    const updateBtn = document.getElementById('update_order');
                    const statusSelect = document.getElementById('order-status-select');
                    if (updateBtn && statusSelect) {
                        updateBtn.onclick = (e) => {
                            e.preventDefault();
                            const newStatus = statusSelect.value;

                            if (typeof updateOrderStatus === 'function' && confirm(`¿Cambiar el estado de la orden #${orderId} a "${newStatus}"?`)) {
                                updateOrderStatus(null, orderId, newStatus);
                            } else if (typeof updateOrderStatus !== 'function') {
                                console.error('ERROR: La función updateOrderStatus no está definida.');
                            }
                        };
                    }
                })
                .catch(err => {
                    console.error('Fetch Details/Items error:', err);
                    if (nameEl) nameEl.textContent = 'Error: Fallo al cargar detalles';
                    if (itemsList) itemsList.innerHTML = '<li>Error de red o del servidor.</li>';
                });
        });
    });


    // -----------------------------------------------------------------
    // 11. Repay Pending/Failed Order Logic
    // -----------------------------------------------------------------
    document.querySelectorAll('.repago-btn').forEach(button => {
        button.addEventListener('click', e => {
            e.preventDefault();

            const orderId = button.dataset.orderId;
            const totalAmount = parseFloat(button.dataset.orderAmount);
            const containerId = `paypal-container-${orderId}`; // ID específico de esa orden

            // 1. **CRÍTICO:** Sobreescribir el order_id activo en sessionStorage.
            // Esto asegura que `initPayPalButtons` y `updateOrderStatus` utilicen el ID de la orden pendiente de Django.
            sessionStorage.setItem('order_id', orderId);

            // Opcional: Ocultar el botón "Continuar con el Pago"
            button.classList.add('d-none');

            // 2. Mostrar el contenedor de PayPal para esa orden
            const container = document.getElementById(containerId);
            if (container) {
                container.classList.remove('d-none');
            }

            // 3. Inicializar los botones de PayPal
            if (totalAmount > 0) {
                initPayPalButtons(totalAmount, containerId);
            } else {
                alert('Monto de la orden inválido para procesar el pago.');
            }
        });
    });

    // -----------------------------------------------------------------
    // 12. Cart – click item → show #selected-item (AJAX)
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
    // 13. Categories - 
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
    const showAddCategoryBtn = document.getElementById('show-add-category');

    // Handle "Crear categoria" button to reset form
    showAddCategoryBtn?.addEventListener('click', function (e) {
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
        row.addEventListener('click', function () {
            populateCategoryDetails(this);
        });
    });

    document.querySelectorAll('.edit-category-btn').forEach(button => {
        button.addEventListener('click', function (e) {
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