from django.urls import path, include
from . import views

app_name = 'store'
urlpatterns = [
    path('products/', include([
        path('', views.all_products, name='products'),
        path('invmgm', views.InventoryManagementView.as_view(), name='invmgm'),
        path('product/<int:product_id>/details/api/', views.product_detail_api, name='product_detail_api'),
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
        path('manage_order/', views.ManageOrder.as_view(), name='manage_order'),
        path('order/<int:order_id>/items/', views.GetOrderItems.as_view(), name='get_order_items'),
        path('my-orders/', views.user_orders, name='user_orders'),
        path('download_product/<str:token>/', views.DownloadFile.as_view(), name='download_product'),
    ])),
    path('category/', include([
        path('add/', views.CategoryView.as_view(), name='add_category'),
        path('edit/<int:category_id>/', views.CategoryView.as_view(), {'action': 'edit_cat'}, name='edit_category'),
        path('delete/<int:category_id>/', views.CategoryView.as_view(), {'action': 'remove_cat'}, name='delete_category'),
        path('<int:category_id>/details/api/', views.category_detail_api, name='category_detail_api'),
    ])),
]
