// app/(tabs)/inventory.tsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BarcodeScanner from '../../components/BarcodeScanner';
import { ANON_FAMILY_ID, supabase } from '../../lib/supabase';
import { InventoryItem } from '../../lib/types';

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [price, setPrice] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    fetchInventory();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('inventory_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        () => fetchInventory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('family_id', ANON_FAMILY_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingItem(null);
    resetForm();
    setModalVisible(true);
  }

  function openEditModal(item: InventoryItem) {
    setEditingItem(item);
    setName(item.name);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setPrice(item.price?.toString() || '');
    setStoreName(item.store_name || '');
    setCategory(item.category || '');
    setExpirationDate(item.expiration_date || '');
    setBarcode(item.barcode || '');
    setModalVisible(true);
  }

  function resetForm() {
    setName('');
    setQuantity('');
    setUnit('units');
    setPrice('');
    setStoreName('');
    setCategory('');
    setExpirationDate('');
    setBarcode('');
  }

  async function saveItem() {
    try {
      if (!name || !quantity) {
        Alert.alert('Error', 'Name and quantity are required');
        return;
      }

      const itemData = {
        family_id: ANON_FAMILY_ID,
        name,
        quantity: parseFloat(quantity),
        unit,
        price: price ? parseFloat(price) : null,
        store_name: storeName || null,
        category: category || null,
        expiration_date: expirationDate || null,
        barcode: barcode || null,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('inventory_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        Alert.alert('Success', 'Item updated');
      } else {
        // Create new item
        const { error } = await supabase
          .from('inventory_items')
          .insert(itemData);

        if (error) throw error;
        Alert.alert('Success', 'Item added to inventory');
      }

      // Learn new product barcode
      if (barcode && name) {
        await supabase.from('product_barcodes').upsert({
          family_id: ANON_FAMILY_ID,
          barcode,
          product_name: name,
          usual_store: storeName || null,
          last_price: price ? parseFloat(price) : null,
          category: category || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'family_id, barcode' });
      }

      setModalVisible(false);
      resetForm();
      fetchInventory();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function deleteItem(id: string) {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('inventory_items')
                .delete()
                .eq('id', id);

              if (error) throw error;
              fetchInventory();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  async function adjustQuantity(item: InventoryItem, delta: number) {
    try {
      const newQuantity = Math.max(0, item.quantity + delta);

      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', item.id);

      if (error) throw error;

      // Check if low stock
      const threshold = item.max_quantity * 0.2;
      if (newQuantity <= threshold && newQuantity > 0) {
        Alert.alert(
          'Low Stock',
          `${item.name} is running low. Add to shopping list?`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Add to List',
              onPress: () => addToShoppingList(item)
            },
          ]
        );
      }

      fetchInventory();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function addToShoppingList(item: InventoryItem) {
    try {
      const neededQuantity = item.max_quantity - item.quantity;

      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          family_id: ANON_FAMILY_ID,
          name: item.name,
          quantity: neededQuantity,
          unit: item.unit,
          preferred_store: item.store_name,
          notes: 'Auto-added: low stock',
        });

      if (error) throw error;
      Alert.alert('Success', 'Added to shopping list');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function handleBarcodeScanned(data: string) {
    setScannerVisible(false);
    setBarcode(data);

    try {
      const { data: product } = await supabase
        .from('product_barcodes')
        .select('*')
        .eq('family_id', ANON_FAMILY_ID)
        .eq('barcode', data)
        .single();

      if (product) {
        setName(product.product_name);
        if (product.usual_store) setStoreName(product.usual_store);
        if (product.last_price) setPrice(product.last_price.toString());
        if (product.category) setCategory(product.category);
        Alert.alert('Product Found', `Filled details for ${product.product_name}`);
      } else {
        Alert.alert('New Barcode', 'Barcode added. Please fill in the details to save it for next time.');
      }
    } catch (error) {
      console.log('Error looking up barcode:', error);
    }
  }

  function getStockStatus(item: InventoryItem): 'low' | 'normal' {
    const threshold = item.max_quantity * 0.2;
    return item.quantity <= threshold ? 'low' : 'normal';
  }

  function renderItem({ item }: { item: InventoryItem }) {
    const stockStatus = getStockStatus(item);
    const percentage = (item.quantity / item.max_quantity) * 100;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.price && (
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit} / {item.max_quantity} {item.unit}
          </Text>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: stockStatus === 'low' ? '#ef4444' : '#22c55e'
                }
              ]}
            />
          </View>

          {item.store_name && (
            <Text style={styles.itemStore}>From: {item.store_name}</Text>
          )}

          {item.expiration_date && (
            <Text style={styles.itemExpiry}>Expires: {item.expiration_date}</Text>
          )}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustQuantity(item, -1)}
          >
            <Text style={styles.adjustButtonText}>-1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustQuantity(item, 1)}
          >
            <Text style={styles.adjustButtonText}>+1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteItem(item.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={fetchInventory}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items in inventory</Text>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Text>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => setScannerVisible(true)}
            >
              <Text style={styles.scanButtonText}>📷 Scan Barcode</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.barcodeInput]}
              placeholder="Barcode"
              value={barcode}
              onChangeText={setBarcode}
              editable={true} // Allow manual entry too
            />

            <TextInput
              style={styles.input}
              placeholder="Item Name *"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Quantity *"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Unit"
                value={unit}
                onChangeText={setUnit}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Store Name"
              value={storeName}
              onChangeText={setStoreName}
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              value={category}
              onChangeText={setCategory}
            />

            <TextInput
              style={styles.input}
              placeholder="Expiration Date (YYYY-MM-DD)"
              value={expirationDate}
              onChangeText={setExpirationDate}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveItem}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarcodeScanned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  cardBody: {
    marginBottom: 12,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  itemStore: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  itemExpiry: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#0284c7',
    fontWeight: '600',
    fontSize: 16,
  },
  barcodeInput: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
});