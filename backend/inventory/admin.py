from django.contrib import admin
from .models import Category, LocationType, Location, Item, StockMovement, Transfer, ItemUnit, ItemLoan


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'abbreviation', 'created_at']
    search_fields = ['name', 'abbreviation']


@admin.register(LocationType)
class LocationTypeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['code', 'name']


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'location_type', 'parent', 'codigo']
    list_filter = ['location_type']
    search_fields = ['name', 'codigo']


@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'kind', 'quantity', 'is_active']
    list_filter = ['category', 'kind', 'is_active']
    search_fields = ['name', 'code', 'sku', 'part_number']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['item', 'movement_type', 'quantity', 'document_type', 'document_number', 'created_at']
    list_filter = ['movement_type', 'document_type']


@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ['item', 'origin_location', 'destination_location', 'quantity', 'status', 'created_at']
    list_filter = ['status']


@admin.register(ItemUnit)
class ItemUnitAdmin(admin.ModelAdmin):
    list_display = ['serial_number', 'item', 'status', 'acquired_at']
    list_filter = ['status']
    search_fields = ['serial_number']


@admin.register(ItemLoan)
class ItemLoanAdmin(admin.ModelAdmin):
    list_display = ['item_unit', 'loaned_by', 'loaned_at', 'returned_at']
    list_filter = ['returned_at']
