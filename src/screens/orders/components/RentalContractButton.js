import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { Button } from 'react-native-paper';
import * as Print from 'expo-print';
import { buildRentalContractHtml } from './rentalContractTemplate';

/* ===== MAP LOẠI KHO ===== */
const STORAGE_TYPE_LABEL = {
  1: 'Kho Nhỏ',
  2: 'Kho Trung',
  3: 'Kho Lớn',
  4: 'Nhà Kho',
  5: 'Nhà Kho (Hết hạn)',
  6: 'Kho Nhỏ (AC)',
  7: 'Kho Trung (AC)',
  8: 'Kho Lớn (AC)',
  9: 'Nhà Kho (AC)',
  10: 'Nhà Kho Oversize',
};

/* ===== MAP LOẠI THÙNG ===== */
const CONTAINER_TYPE_LABEL = {
  1: 'Thùng A',
  2: 'Thùng B',
  3: 'Thùng C',
  4: 'Thùng D',
};

/* ===== HELPER: LẤY LOẠI CHI TIẾT ===== */
function getDetailTypeLabel(it) {
  // --- THÙNG ---
  const containerId =
    it?.containerTypeId ??
    it?.containerType ??
    it?.container_id;

  if (containerId) {
    return CONTAINER_TYPE_LABEL[Number(containerId)] ?? 'Thùng';
  }

  // --- KHO ---
  const storageId =
    it?.storageTypeId ??
    it?.storageType ??
    it?.storage_id;

  if (storageId) {
    return STORAGE_TYPE_LABEL[Number(storageId)] ?? 'Kho';
  }

  // --- KỆ ---
  const shelfId =
    it?.shelfTypeId ??
    it?.shelfType ??
    it?.shelf_id;

  if (shelfId) {
    return 'Kệ';
  }

  return '-';
}

export default function RentalContractButton({
  order,
  details = [],
  customer,
  formatDate,
}) {
  const printContract = useCallback(async () => {
    try {
      if (!order?.orderCode) {
        Alert.alert('Lỗi', 'Không có mã đơn để in hợp đồng.');
        return;
      }

      const html = buildRentalContractHtml({
        order,
        details,
        customer,
        formatDate,
        getDetailTypeLabel, 
      });

      await Print.printAsync({ html });
    } catch (e) {
      console.error('print contract error', e);
      Alert.alert('Lỗi', 'Không thể in hợp đồng thuê.');
    }
  }, [order, details, customer, formatDate]);

  return (
    <Button
      mode="outlined"
      icon="file-document"
      onPress={printContract}
    >
      In hợp đồng thuê
    </Button>
  );
}
