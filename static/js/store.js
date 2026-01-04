// -----------------------------------------------------------------
// 0. CSRF token – always present in Django forms
// -----------------------------------------------------------------
const csrfTokenEl = document.querySelector('input[name="csrfmiddlewaretoken"]');
const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';
window.csrfToken = csrfToken;

// -----------------------------------------------------------------
// 1. NUEVA FUNCIÓN: Finaliza el Pago y Desencadena el Fulfillment
//    Esta función reemplaza la lógica de updateOrderStatus (Sección 6) 
//    y llama al orquestador capture_paypal_orderView en el backend.
// -----------------------------------------------------------------
async function finalUpdateOrderStatus(orderId, paypalOrderId) {
    console.log('Finalizing order status and triggering fulfillment...');

    // Endpoint de capture_paypal_orderView, el orquestador post-pago
    const url = '/store/orders/capture_paypal_order/'; 

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Usamos window.csrfToken, asumiendo que se definió al inicio del script
                'X-CSRFToken': window.csrfToken 
            },
            body: JSON.stringify({
                order_id: orderId,
                paypal_order_id: paypalOrderId,
                // **IMPORTANTE:** Ya no se envía paymentStatus ni shippingData.
                // El backend los obtiene directamente de la API de PayPal.
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Payment captured successfully:', data);
            
            // ------------------------------------------------------------------

            sessionStorage.clear(); // Limpia la sesión del carrito

            // Redirigir al cliente usando la URL devuelta por el backend (o user_orders)
            if (data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                console.error('Finalización exitosa, pero no se recibió una URL de redirección.', data);
                window.location.href = '/store/orders/my-orders/';
            }
        } else {
            console.error('Error finalizing order:', data.error || 'Mensaje de error desconocido');
            // Redirección a fallback o página de órdenes
            window.location.href = data.redirect_url || '/store/orders/my-orders/';
        }
    } catch (error) {
        console.error('Network or processing error during finalization:', error);
        alert('Ocurrió un error de conexión o procesamiento durante la finalización del pedido.');
    }
}

// -----------------------------------------------------------------
// 2. Manual Order Status Update (Admin)
// -----------------------------------------------------------------
async function updateOrderStatus(orderId, newStatus) {
    console.log(`[updateOrderStatus] Starting update for order ${orderId} to status: ${newStatus}`);
    console.log(`[updateOrderStatus] CSRF Token:`, window.csrfToken);
    
    const url = '/store/orders/manage_order/';
    
    const payload = {
        order_id: orderId,
        manual_status_update: true,
        payment_status: newStatus
    };
    
    console.log(`[updateOrderStatus] Payload:`, payload);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.csrfToken
            },
            body: JSON.stringify(payload)
        });
        
        console.log(`[updateOrderStatus] Response status:`, response.status);
        
        const data = await response.json();
        console.log(`[updateOrderStatus] Response data:`, data);
        
        if (response.ok) {
            console.log('[updateOrderStatus] Success! Order status updated:', data);
            alert(`Estado actualizado a: ${newStatus}`);
            // Refresh the order details by clicking the order item again
            const orderRow = document.querySelector(`.order-item[data-order-id="${orderId}"]`);
            if (orderRow) {
                console.log(`[updateOrderStatus] Refreshing order details by clicking row with order-id: ${orderId}`);
                orderRow.click();
            } else {
                console.warn(`[updateOrderStatus] Could not find order row with order-id: ${orderId}`);
            }
        } else {
            console.error('[updateOrderStatus] Server returned error:', data);
            alert('Error: ' + (data.error || 'No se pudo actualizar el estado'));
        }
    } catch (error) {
        console.error('[updateOrderStatus] Network/fetch error:', error);
        alert('Error de conexión al actualizar el estado');
    }
}

// -----------------------------------------------------------------
// 3. Reset Download Status (Superuser Only)
// -----------------------------------------------------------------
async function resetDownloadStatus(orderId) {
    console.log(`[resetDownloadStatus] Resetting downloads for order ${orderId}`);
    
    const url = `/store/orders/reset_download/${orderId}/`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.csrfToken,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✓ ${data.message}\nLos compradores pueden volver a descargar sus productos.`);
            console.log('[resetDownloadStatus] Success:', data);
            
            // Refresh the order details to show updated download status
            const orderRow = document.querySelector(`.order-item[data-order-id="${orderId}"]`);
            if (orderRow) {
                orderRow.click();
            }
        } else {
            console.error('[resetDownloadStatus] Server error:', data);
            alert('Error: ' + (data.error || 'No se pudo resetear las descargas'));
        }
    } catch (error) {
        console.error('[resetDownloadStatus] Network error:', error);
        alert('Error de conexión al resetear las descargas');
    }
}


const isShippingComplete = () => {
    // Check if the #envio tab has the 'is-complete' class
    const envioTab = document.getElementById('envio');
    if (envioTab && envioTab.classList.contains('is-complete')) {
        return true;
    }
    
    // Check sessionStorage for shipping data
    const savedShipping = sessionStorage.getItem('shipping_data');
    if (savedShipping) {
        try {
            const shippingData = JSON.parse(savedShipping);
            // Verify all required fields are present
            if (shippingData.name && shippingData.email && shippingData.address && 
                shippingData.city && shippingData.zipcode && shippingData.country) {
                return true;
            }
        } catch (e) {
            console.error('Error parsing shipping data:', e);
        }
    }
    
    return false;
};


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
    // 1. Product Add Form – Shows upload interface for PDF products uploading
    // -----------------------------------------------------------------
    const downloadableCheckbox = document.getElementById('id_is_digital');
    const fileSection = document.getElementById('download-file-section');

    const toggleFileInput = () => {
        if (!downloadableCheckbox || !fileSection) return;
        if (downloadableCheckbox.checked) {
            fileSection.style.display = 'block';
        } else {
            fileSection.style.display = 'none';
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

            const formData = new FormData(form);
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData
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

            const url = btn.getAttribute('href');
            // Extract product ID from URL: /store/cart/remove/123/ -> 123
            const productId = url.split('/').filter(Boolean).pop();
            console.log('Removing item via URL:', url, 'ID:', productId);

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

    const renderPayPalButtons = (containerId = 'paypal-button-container') => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (typeof paypal === 'undefined') {
            console.warn('PayPal SDK not loaded yet. Retrying in 500ms...');
            setTimeout(() => renderPayPalButtons(containerId), 500);
            return;
        }

        container.innerHTML = '';

        // --- MODIFICACIÓN CLAVE: Obtener orderId del atributo de datos del contenedor ---
        const orderId = container.dataset.orderId;
        const hasPhysical = container.dataset.hasPhysical === 'true';
        // --------------------------------------------------------------------------------

        if (!orderId || orderId === 'None') {
            console.error(`Invalid or missing order ID ('${orderId}') in DOM attribute 'data-order-id' for container #${containerId}.`);
            return;
        }

        // --- NUEVA LÓGICA DE VALIDACIÓN DE ENVÍO ---
        if (hasPhysical && !isShippingComplete()) {
            // Mostrar un mensaje de advertencia claro en el contenedor de PayPal
            container.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    ⚠️ **¡Información de Envío Incompleta!** Por favor, completa la información de envío
                    en la pestaña "Datos de envio" antes de proceder al pago.
                </div>
            `;
            // Detener la renderización de PayPal
            return;
        }
        // --- FIN DE LA LÓGICA DE VALIDACIÓN ---

        paypal.Buttons({
            // 1. MODIFICACIÓN: createOrder llama al backend para crear la orden en PayPal
            createOrder: function(data, actions) {
                // Get shipping data from sessionStorage if available
                let shippingData = null;
                const savedShipping = sessionStorage.getItem('shipping_data');
                if (savedShipping) {
                    try {
                        shippingData = JSON.parse(savedShipping);
                    } catch (e) {
                        console.error('Error parsing shipping data:', e);
                    }
                }
                
                // Llama a la vista que lee Order.hasPhysical y habla con la API de PayPal
                return fetch('/store/orders/create_paypal_order/', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': window.csrfToken
                    },
                    body: JSON.stringify({
                        order_id: orderId, // Usa el orderId leído del DOM
                        shipping_data: shippingData // Send shipping data to backend
                    })
                }).then(function(response) {
                    if (!response.ok) {
                        return response.json().then(err => { throw new Error(err.error || 'Error creating order'); });
                    }
                    return response.json();
                }).then(function(orderData) {
                    // El backend devuelve el paypal_order_id
                    return orderData.paypal_order_id; 
                }).catch(error => {
                    console.error('Error en createOrder:', error);
                    throw error;
                });
            },

            // 2. MODIFICACIÓN: onApprove llama a la nueva función finalUpdateOrderStatus
            onApprove: function(data, actions) {
                const paypalOrderId = data.orderID; // ID de la orden de PayPal
                
                // Llama a la función global finalUpdateOrderStatus
                return finalUpdateOrderStatus(orderId, paypalOrderId);
            },

            // Manejo de errores
            onError: function (err) {
                console.error('Error de PayPal:', err);
                alert('Hubo un error al cargar la pasarela de pago. Por favor recarga la página.');
            }

        }).render(`#${containerId}`); 
    }
    
    // Make renderPayPalButtons globally accessible
    window.renderPayPalButtons = renderPayPalButtons;

    // Initialize PayPal buttons if the container exists on the page
    if (document.getElementById('paypal-button-container')) {
        renderPayPalButtons();
    }
    
    // -----------------------------------------------------------------
    // 5. Shipping Form Handler (Shopping Cart)
    // -----------------------------------------------------------------
    const shippingForm = document.querySelector('#envio form');
    const envioTab = document.getElementById('envio');
    const envioTabButton = document.getElementById('envio-tab');
    
    if (shippingForm) {
        shippingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(shippingForm);
            const shippingData = {
                name: formData.get('name'),
                email: formData.get('email'),
                address: formData.get('address'),
                city: formData.get('city'),
                zipcode: formData.get('zipcode'),
                country: formData.get('country')
            };
            
            // Save to session storage for client-side validation
            sessionStorage.setItem('shipping_data', JSON.stringify(shippingData));
            
            // Mark shipping as complete
            envioTab.classList.add('is-complete');
            envioTabButton.classList.add('is-complete');
            
            // Show success message
            alert('✓ Datos de envío guardados correctamente.\n\nYa puedes proceder al pago.');
            
            // Switch to cart tab
            document.getElementById('carrito-tab').click();
            
            // Re-render PayPal buttons to remove warning
            if (typeof window.renderPayPalButtons === 'function') {
                window.renderPayPalButtons();
            }
        });
    }
    
    // Check if shipping data already exists in session
    const savedShipping = sessionStorage.getItem('shipping_data');
    if (savedShipping && envioTab && envioTabButton) {
        envioTab.classList.add('is-complete');
        envioTabButton.classList.add('is-complete');
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
            document.querySelectorAll('.order-item')
                .forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');

            const detailsPane = document.getElementById('order-details');
            if (detailsPane) detailsPane.classList.remove('d-none');

            const orderId = row.dataset.orderId;
            const itemsList = document.getElementById('order-items');
            itemsList.innerHTML = '<li>Cargando...</li>';

            fetch(`/store/orders/order/${orderId}/details/api/`)
                .then(r => r.ok ? r.json() : Promise.reject(r.status))
                .then(data => {
                    document.querySelector('#order-details .order-id-display').textContent = data.id;
                    document.querySelector('#order-details .total-price-display').textContent = `$${data.totalAmount}`;
                    document.querySelector('#order-details .status-display').textContent = data.paymentStatus_display;
                    
                    // Update select value
                    const statusSelectEl = document.getElementById('order-status-select');
                    if (statusSelectEl) {
                        statusSelectEl.value = data.paymentStatus;
                    }

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
                                
                                // Build download status indicator
                                let downloadBadge = '';
                                if (item.is_digital && item.download_status) {
                                    if (item.download_status.downloaded) {
                                        downloadBadge = `<span class="badge bg-success ms-2" title="Descargado el ${item.download_status.downloaded_at}">
                                            <i class="fa-solid fa-check"></i> Descargado
                                        </span>`;
                                    } else {
                                        downloadBadge = `<span class="badge bg-warning ms-2">
                                            <i class="fa-solid fa-clock"></i> Pendiente
                                        </span>`;
                                    }
                                }
                                
                                li.innerHTML = `
                                        <span>${item.product_name} x ${item.quantity}${downloadBadge}</span>
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
                    console.log('[DEBUG] Update button found:', updateBtn);
                    console.log('[DEBUG] Status select found:', statusSelect);
                    
                    if (updateBtn && statusSelect) {
                        console.log('[DEBUG] Attaching click handler to update button');
                        updateBtn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation(); // CRITICAL: Prevent event from bubbling to row click handler
                            console.log('[DEBUG] Update button clicked!');
                            const newStatus = statusSelect.value;
                            console.log('[DEBUG] Selected status:', newStatus);

                            // TEMPORARILY REMOVED CONFIRMATION DIALOG FOR TESTING
                            console.log('[DEBUG] Calling updateOrderStatus directly (no confirmation)');
                            updateOrderStatus(orderId, newStatus);
                        };
                    } else {
                        console.error('[DEBUG] Update button or status select not found!');
                    }
                    
                    // Attach handler for reset download button
                    const resetDownloadBtn = document.getElementById('reset_download');
                    if (resetDownloadBtn) {
                        console.log('[DEBUG] Reset download button found');
                        
                        // Check if order has downloadable items
                        const hasDownloadables = data.items.some(item => item.is_digital);
                        const isCompleted = data.paymentStatus === 'completed';
                        
                        if (hasDownloadables && isCompleted) {
                            resetDownloadBtn.classList.remove('d-none');
                            
                            resetDownloadBtn.onclick = (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[DEBUG] Reset download button clicked!');
                                
                                if (confirm('¿Permitir que el comprador descargue de nuevo?\n\nEsto reseteará el estado de descarga de todos los productos digitales en este pedido.')) {
                                    resetDownloadStatus(orderId);
                                }
                            };
                        } else {
                            resetDownloadBtn.classList.add('d-none');
                        }
                    }

                })
                .catch(err => {
                    console.error('Fetch Details/Items error:', err);
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

            const orderIdToRepeat = button.dataset.orderId;
            
            // --- 1. Feedback visual mientras se procesa ---
            button.disabled = true;
            button.textContent = 'Cargando carrito...';
            
            // Ya no necesitamos la lógica de sessionStorage.setItem('order_id', orderId); 
            // El backend maneja qué carrito debe estar activo.
            
            // Ya no necesitamos la lógica de ocultar/mostrar contenedores de PayPal.

            // --- 2. Llamada AJAX a la vista de Django para COPIAR los ítems ---
            fetch(`/store/cart/repeat_order/${orderIdToRepeat}/`, { 
                method: 'POST',
                headers: {
                    'X-CSRFToken': window.csrfToken, // CSRF es esencial para POST
                    'Content-Type': 'application/json'
                }
            })
            .then(r => {
                // Comprobación inicial de la respuesta HTTP
                if (!r.ok) {
                    // Lanza un error para ser capturado en el catch
                    return r.json().then(errorData => {throw new Error(errorData.error || 'Server error.');});
                }
                return r.json();
            })
            .then(data => {
                // --- 3. Manejo de la Respuesta de Éxito ---
                if (data.success) {
                    // Éxito: Los ítems han sido copiados al carrito activo.
                    // Redirigir al usuario al carrito para que pueda revisar los ítems.
                    alert('¡Orden cargada con éxito! Revisa tu carrito antes de pagar.');
                    window.location.href = '/store/cart/'; // Ajusta la URL de tu carrito
                } else {
                    // Manejo de errores de negocio devueltos por Django (ej: orden no existe)
                    console.error('Error al reordenar:', data.error);
                    alert('No se pudo cargar la orden. Error: ' + data.error);
                    // Restaurar el botón
                    button.disabled = false;
                    button.textContent = 'Pagar de Nuevo'; 
                }
            })
            .catch(err => {
                // --- 4. Manejo de Errores de Red o Servidor ---
                console.error('Error de conexión:', err);
                alert('Error al comunicarse con el servidor. Intenta de nuevo.');
                // Restaurar el botón
                button.disabled = false;
                button.textContent = 'Pagar de Nuevo'; 
            });
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
                    document.getElementById('selected-product-description').textContent = data.product_description;
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
        document.getElementById('cat_id_name').value = '';
        document.getElementById('cat_id_description').value = '';
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
                document.getElementById('category-display-name-display').textContent = data.display_name || 'N/A';
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
            document.getElementById('cat_id_name').value = categoryName;
            document.getElementById('cat_id_description').value = categoryDescription;

            // Update form action for edit
            form.action = `/store/category/edit/${categoryId}/`;

            // Show the add-category form
            addCategory.classList.remove('d-none');
        });
    });
    
    // -----------------------------------------------------------------
    // 14. Bulk Order Actions
    // -----------------------------------------------------------------
    const bulkStatusSelect = document.getElementById('bulk-status-select');
    const applyBulkBtn = document.getElementById('apply-bulk-action');
    const selectedCountSpan = document.getElementById('selected-count');
    const orderCheckboxes = document.querySelectorAll('.order-checkbox');

    const updateSelectedCount = () => {
        const checked = document.querySelectorAll('.order-checkbox:checked');
        if (selectedCountSpan) {
            selectedCountSpan.textContent = checked.length;
        }
    };

    orderCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedCount);
        cb.addEventListener('click', e => e.stopPropagation());
    });

    async function bulkUpdateOrderStatus(orderIds, newStatus) {
        const url = '/store/orders/manage_order/';
        const payload = {
            order_ids: orderIds,
            manual_status_update: true,
            payment_status: newStatus
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.csrfToken
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✓ ${data.message}`);
                window.location.reload();
            } else {
                alert('Error: ' + (data.error || 'Bulk update failed'));
            }
        } catch (error) {
            console.error('Bulk update error:', error);
            alert('Error de conexión al actualizar.');
        }
    }

    if (applyBulkBtn) {
        applyBulkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const newStatus = bulkStatusSelect.value;
            if (!newStatus) {
                alert('Por favor selecciona un estado.');
                return;
            }

            const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
            if (checkedBoxes.length === 0) {
                alert('Por favor selecciona al menos un pedido.');
                return;
            }

            const orderIds = Array.from(checkedBoxes).map(cb => cb.value);
            bulkUpdateOrderStatus(orderIds, newStatus);
        });
    }

});