// app/(tabs)/index.tsx — Scanner-first home screen (MVP)
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import BarcodeScanner from '../../components/BarcodeScanner';
import { ANON_FAMILY_ID, supabase } from '../../lib/supabase';

export default function ScannerScreen() {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [manualInput, setManualInput] = useState('');

  // Quick-adjust modal: shown when item is found in inventory
  const [foundItem, setFoundItem] = useState<any>(null);
  const [foundItemQty, setFoundItemQty] = useState(0);
  const [foundModalVisible, setFoundModalVisible] = useState(false);

  // Add-item modal: shown when item is NOT in inventory
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newUnit, setNewUnit] = useState('units');
  const [newBarcode, setNewBarcode] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDestination, setNewDestination] = useState<'inventory' | 'shopping_list'>('inventory');

  function resetAddForm() {
    setNewName('');
    setNewQty('1');
    setNewUnit('units');
    setNewBarcode('');
    setNewStore('');
    setNewLocation('');
    setNewDestination('inventory');
  }

  async function handleBarcodeScanned(scannedBarcode: string) {
    setScannerVisible(false);
    await lookupAndAct(scannedBarcode);
  }

  async function handleManualSearch() {
    const input = manualInput.trim();
    if (!input) return;
    await lookupAndAct(input);
  }

  async function lookupAndAct(input: string) {
    try {
      const isBarcode = /^\d+$/.test(input);

      // 1. Search inventory by barcode (if numeric) or by name
      const query = supabase
        .from('inventory_items')
        .select('*')
        .eq('family_id', ANON_FAMILY_ID);

      const { data: inventoryMatch } = isBarcode
        ? await query.eq('barcode', input).maybeSingle()
        : await query.ilike('name', `%${input}%`).limit(1).maybeSingle();

      if (inventoryMatch) {
        setFoundItem(inventoryMatch);
        setFoundItemQty(inventoryMatch.quantity);
        setFoundModalVisible(true);
        return;
      }

      // 2. Not in inventory — check product_barcodes for a known name
      let knownName = '';
      if (isBarcode) {
        const { data: knownProduct } = await supabase
          .from('product_barcodes')
          .select('product_name')
          .eq('family_id', ANON_FAMILY_ID)
          .eq('barcode', input)
          .maybeSingle();
        if (knownProduct) knownName = knownProduct.product_name;
      }

      // 3. Open add-item modal pre-filled with whatever we know
      resetAddForm();
      setNewBarcode(isBarcode ? input : '');
      setNewName(knownName || (!isBarcode ? input : ''));
      setAddModalVisible(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function saveNewItem() {
    if (!newName || !newQty) {
      Alert.alert('Error', 'Name and quantity are required');
      return;
    }
    try {
      if (newDestination === 'inventory') {
        const { error } = await supabase.from('inventory_items').insert({
          family_id: ANON_FAMILY_ID,
          name: newName,
          quantity: parseFloat(newQty),
          unit: newUnit,
          max_quantity: parseFloat(newQty),
          barcode: newBarcode || null,
          store_name: newStore || null,
          location: newLocation || null,
        });
        if (error) throw error;

        // Remember barcode → product name association
        if (newBarcode) {
          await supabase.from('product_barcodes').upsert({
            family_id: ANON_FAMILY_ID,
            barcode: newBarcode,
            product_name: newName,
            usual_store: newStore || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'family_id,barcode' });
        }
      } else {
        const { error } = await supabase.from('shopping_list_items').insert({
          family_id: ANON_FAMILY_ID,
          name: newName,
          quantity: parseFloat(newQty),
          unit: newUnit,
          preferred_store: newStore || null,
        });
        if (error) throw error;
      }

      const savedName = newName;
      const destination = newDestination;
      setAddModalVisible(false);
      resetAddForm();
      setManualInput('');

      const destinationLabel = destination === 'inventory' ? 'Inventory' : 'Shopping List';
      const destinationRoute = destination === 'inventory'
        ? '/(tabs)/Inventory'
        : '/(tabs)/shopping-list';

      Alert.alert(
        'Saved!',
        `${savedName} added to ${destinationLabel}.`,
        [
          { text: '📷 Scan Another' },
          {
            text: `Go to ${destinationLabel}`,
            onPress: () => router.navigate(destinationRoute as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  async function applyQuantityChange() {
    if (!foundItem) return;
    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({ quantity: foundItemQty })
        .eq('id', foundItem.id);
      if (error) throw error;

      const itemName = foundItem.name;
      setFoundModalVisible(false);
      setFoundItem(null);
      setManualInput('');

      Alert.alert(
        'Updated!',
        `${itemName} quantity updated.`,
        [
          { text: '📷 Scan Another' },
          {
            text: 'Go to Inventory',
            onPress: () => router.navigate('/(tabs)/Inventory' as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Pantry</Text>
        <Text style={styles.subtitle}>Scan or search to manage items</Text>
      </View>

      <View style={styles.body}>
        {/* Primary action: scan barcode */}
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScannerVisible(true)}
        >
          <Text style={styles.scanIcon}>📷</Text>
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Fallback: type product name or barcode */}
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            placeholder="Product name or barcode..."
            value={manualInput}
            onChangeText={setManualInput}
            onSubmitEditing={handleManualSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
            <Text style={styles.searchButtonText}>Go</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera barcode scanner */}
      <BarcodeScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarcodeScanned}
      />

      {/* Found in inventory: quick quantity adjust */}
      <Modal visible={foundModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{foundItem?.name}</Text>
            <Text style={styles.modalSubtitle}>Already in inventory</Text>

            {foundItem?.store_name && (
              <Text style={styles.infoRow}>Store: {foundItem.store_name}</Text>
            )}
            {foundItem?.location && (
              <Text style={styles.infoRow}>Aisle: {foundItem.location}</Text>
            )}
            {foundItem?.category && (
              <Text style={styles.infoRow}>Category: {foundItem.category}</Text>
            )}
            {foundItem?.price != null && (
              <Text style={styles.infoRow}>Price: ${foundItem.price.toFixed(2)}</Text>
            )}

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setFoundItemQty(q => Math.max(0, q - 1))}
              >
                <Text style={styles.qtyButtonText}>-1</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>
                {foundItemQty} {foundItem?.unit}
              </Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setFoundItemQty(q => q + 1)}
              >
                <Text style={styles.qtyButtonText}>+1</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setFoundModalVisible(false); setFoundItem(null); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={applyQuantityChange}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Not in inventory: add new item */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add to {newDestination === 'inventory' ? 'Inventory' : 'Shopping List'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                style={styles.input}
                placeholder="Item Name *"
                value={newName}
                onChangeText={setNewName}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Quantity *"
                  value={newQty}
                  onChangeText={setNewQty}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Unit"
                  value={newUnit}
                  onChangeText={setNewUnit}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Retailer / Store"
                value={newStore}
                onChangeText={setNewStore}
              />
              <TextInput
                style={styles.input}
                placeholder="Aisle / Location"
                value={newLocation}
                onChangeText={setNewLocation}
              />

              {/* Destination toggle */}
              <View style={styles.destinationRow}>
                <TouchableOpacity
                  style={[styles.destButton, newDestination === 'inventory' && styles.destButtonActive]}
                  onPress={() => setNewDestination('inventory')}
                >
                  <Text style={[styles.destButtonText, newDestination === 'inventory' && styles.destButtonTextActive]}>
                    📦 Inventory
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.destButton, newDestination === 'shopping_list' && styles.destButtonActive]}
                  onPress={() => setNewDestination('shopping_list')}
                >
                  <Text style={[styles.destButtonText, newDestination === 'shopping_list' && styles.destButtonTextActive]}>
                    🛒 Shopping List
                  </Text>
                </TouchableOpacity>
              </View>

              {newBarcode ? (
                <Text style={styles.barcodeLabel}>Barcode: {newBarcode}</Text>
              ) : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setAddModalVisible(false); resetAddForm(); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveNewItem}
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  scanIcon: {
    fontSize: 48,
  },
  scanButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  infoRow: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    marginBottom: 24,
  },
  qtyButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  qtyValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    minWidth: 80,
    textAlign: 'center',
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
  destinationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  destButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  destButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  destButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  destButtonTextActive: {
    color: '#fff',
  },
  barcodeLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
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
