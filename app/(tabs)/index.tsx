// app/(tabs)/index.tsx — Scanner-first home screen (MVP)
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
      setNewBarcode(isBarcode ? input : '');
      setNewName(knownName || (!isBarcode ? input : ''));
      setNewQty('1');
      setNewUnit('units');
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
      const { error } = await supabase.from('inventory_items').insert({
        family_id: ANON_FAMILY_ID,
        name: newName,
        quantity: parseFloat(newQty),
        unit: newUnit,
        max_quantity: parseFloat(newQty),
        barcode: newBarcode || null,
      });
      if (error) throw error;
      setAddModalVisible(false);
      setManualInput('');
      Alert.alert('Added', `${newName} added to inventory`);
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
      setFoundModalVisible(false);
      setFoundItem(null);
      setManualInput('');
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
            <Text style={styles.modalTitle}>Add to Inventory</Text>

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
            {newBarcode ? (
              <Text style={styles.barcodeLabel}>Barcode: {newBarcode}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setAddModalVisible(false)}
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
    marginBottom: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
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
