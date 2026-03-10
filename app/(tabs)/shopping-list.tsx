// app/(tabs)/shopping-list.tsx
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
import { ANON_FAMILY_ID, supabase } from '../../lib/supabase';
import { ShoppingListItem } from '../../lib/types';

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupByStore, setGroupByStore] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('units');
  const [preferredStore, setPreferredStore] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchShoppingList();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('shopping_list_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_list_items' },
        () => fetchShoppingList()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchShoppingList() {
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('family_id', ANON_FAMILY_ID)
        .order('is_checked', { ascending: true })
        .order('sort_order', { ascending: true })
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
    resetForm();
    setModalVisible(true);
  }

  function resetForm() {
    setName('');
    setQuantity('');
    setUnit('units');
    setPreferredStore('');
    setNotes('');
  }

  async function addItem() {
    try {
      if (!name || !quantity) {
        Alert.alert('Error', 'Name and quantity are required');
        return;
      }

      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          family_id: ANON_FAMILY_ID,
          name,
          quantity: parseFloat(quantity),
          unit,
          preferred_store: preferredStore || null,
          notes: notes || null,
        });

      if (error) throw error;

      setModalVisible(false);
      resetForm();
      fetchShoppingList();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function toggleChecked(item: ShoppingListItem) {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: !item.is_checked })
        .eq('id', item.id);

      if (error) throw error;
      fetchShoppingList();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function deleteItem(id: string) {
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchShoppingList();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function clearCheckedItems() {
    Alert.alert(
      'Clear Checked Items',
      'Remove all checked items from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('shopping_list_items')
                .delete()
                .eq('family_id', ANON_FAMILY_ID)
                .eq('is_checked', true);

              if (error) throw error;
              fetchShoppingList();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  async function moveCheckedToInventory() {
    Alert.alert(
      'Move to Inventory',
      'Move checked items to inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: async () => {
            try {
              const checkedItems = items.filter(item => item.is_checked);

              for (const item of checkedItems) {
                // Check if item exists in inventory
                const { data: existing } = await supabase
                  .from('inventory_items')
                  .select('*')
                  .eq('family_id', ANON_FAMILY_ID)
                  .eq('name', item.name)
                  .single();

                if (existing) {
                  // Update existing inventory item
                  await supabase
                    .from('inventory_items')
                    .update({
                      quantity: existing.quantity + item.quantity,
                      store_name: item.preferred_store || existing.store_name,
                    })
                    .eq('id', existing.id);
                } else {
                  // Create new inventory item
                  await supabase
                    .from('inventory_items')
                    .insert({
                      family_id: ANON_FAMILY_ID,
                      name: item.name,
                      quantity: item.quantity,
                      unit: item.unit,
                      max_quantity: item.quantity,
                      store_name: item.preferred_store,
                    });
                }

                // Delete from shopping list
                await supabase
                  .from('shopping_list_items')
                  .delete()
                  .eq('id', item.id);
              }

              Alert.alert('Success', `Moved ${checkedItems.length} items to inventory`);
              fetchShoppingList();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  function groupItemsByStore() {
    if (!groupByStore) return { '': items };

    const grouped: { [key: string]: ShoppingListItem[] } = {};

    items.forEach(item => {
      const store = item.preferred_store || 'No Store Set';
      if (!grouped[store]) {
        grouped[store] = [];
      }
      grouped[store].push(item);
    });

    return grouped;
  }

  function renderItem({ item }: { item: ShoppingListItem }) {
    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          item.is_checked && styles.listItemChecked
        ]}
        onPress={() => toggleChecked(item)}
      >
        <View style={styles.checkbox}>
          {item.is_checked && <View style={styles.checkboxFilled} />}
        </View>

        <View style={styles.itemContent}>
          <Text style={[
            styles.itemName,
            item.is_checked && styles.itemNameChecked
          ]}>
            {item.name}
          </Text>

          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit}
          </Text>

          {item.notes && (
            <Text style={styles.itemNotes}>{item.notes}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteItem(item.id)}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  function renderGroupedList() {
    const grouped = groupItemsByStore();
    const stores = Object.keys(grouped);

    return (
      <FlatList
        data={stores}
        keyExtractor={(store) => store}
        renderItem={({ item: store }) => (
          <View style={styles.storeSection}>
            <Text style={styles.storeHeader}>{store.toUpperCase()}</Text>
            {grouped[store].map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Shopping list is empty</Text>
        }
      />
    );
  }

  const checkedCount = items.filter(item => item.is_checked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>
        <TouchableOpacity
          style={styles.groupToggle}
          onPress={() => setGroupByStore(!groupByStore)}
        >
          <Text style={styles.groupToggleText}>
            {groupByStore ? '📋 By Store' : '📝 All Items'}
          </Text>
        </TouchableOpacity>
      </View>

      {groupByStore ? renderGroupedList() : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={fetchShoppingList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Shopping list is empty</Text>
          }
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>

        {checkedCount > 0 && (
          <>
            <TouchableOpacity
              style={styles.moveButton}
              onPress={moveCheckedToInventory}
            >
              <Text style={styles.moveButtonText}>
                Move to Inventory ({checkedCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearCheckedItems}
            >
              <Text style={styles.clearButtonText}>Clear Checked</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>

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
              placeholder="Preferred Store"
              value={preferredStore}
              onChangeText={setPreferredStore}
            />

            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
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
                onPress={addItem}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  groupToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  groupToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  storeSection: {
    marginBottom: 16,
  },
  storeHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listItemChecked: {
    backgroundColor: '#f9fafb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: 16,
    height: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemNotes: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#9ca3af',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  moveButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  moveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
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
});