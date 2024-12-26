from django.urls import path, include
from . import views


app_name = 'store'
urlpatterns = [
    path('products/', include([
        path('', views.all_products, name='products'),
        path('invmgm', views.InventoryManagementView.as_view(), name='invmgm'),
        path('<int:product_id>/', views.product_detail, name='product_detail'),
        path('add/', views.add_product, name='add_product'),
        path('edit/<int:product_id>/', views.edit_product, name='edit_product'),
        path('delete/<int:product_id>/', views.delete_product, name='delete_product'),
    ])),
    path('cart/', include([
        path('', views.Cart.as_view(), name='cart_view'),
        path('add/<int:product_id>/', views.Cart.as_view(), {'action': 'add'}, name='cart_add'),
        path('remove/<int:product_id>/', views.Cart.as_view(), {'action': 'remove'}, name='cart_remove'),
        path('update/<int:product_id>/', views.Cart.as_view(), {'action': 'update'}, name='cart_update'),
        path('clear/', views.Cart.as_view(), {'action': 'clear'}, name='cart_clear'),
    ])),
    path('orders/', include([
        path('create/', views.CreateOrder.as_view(), name='create_order'),
        path('update_payment/', views.UpdateOrder.as_view(), name='update_order_payment'),
    ])),
    path('category/', include([
        path('add/', views.CategoryView.as_view(), name='add_category'),
        path('edit/<int:category_id>/', views.CategoryView.as_view(), {'action': 'edit_cat'}, name='edit_category'),
        path('delete/<int:category_id>/', views.CategoryView.as_view(), {'action': 'remove_cat'}, name='delete_category'),
    ])),
]
