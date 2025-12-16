import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { Button } from 'react-native-paper';
import * as Print from 'expo-print';

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
const CONTAINER_TYPE_LABEL = {
  1: 'Thùng A',
  2: 'Thùng B',
  3: 'Thùng C',
  4: 'Thùng D',
};
function getDetailTypeLabel(it) {
  const containerId =
    it?.containerTypeId ??
    it?.containerType ??
    it?.container_id;

  if (containerId) {
    return CONTAINER_TYPE_LABEL[Number(containerId)] ?? '-';
  }

  const storageId =
    it?.storageTypeId ??
    it?.storageType ??
    it?.storage_id;

  if (storageId) {
    return STORAGE_TYPE_LABEL[Number(storageId)] ?? 'Kho';
  }

  const shelfId =
    it?.shelfTypeId ??
    it?.shelfType ??
    it?.shelf_id;

  if (shelfId) {
    return 'Kệ';
  }

  return '-';
}


export default function OrderPrintButton({
    order,
    details = [],
    totalPrice,
    formatDate,
    mapStatusToVN,
    lookups,
}) {
    const printOrderPdf = useCallback(async () => {
        try {
            if (!order?.orderCode && !order?.id) {
                Alert.alert('Lỗi', 'Không có thông tin đơn hàng.');
                return;
            }

            const qrPayload = {
                orderCode: order?.orderCode ?? order?.id,
                customerName: order?.customerName ?? order?.customer?.name,
                total: totalPrice,
                status: mapStatusToVN(order?.status),
            };

            const qrUrl =
                'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' +
                encodeURIComponent(JSON.stringify(qrPayload));

            const detailRows =
                Array.isArray(details) && details.length > 0
                    ? details.map((it, idx) => {
                        const typeLabel = getDetailTypeLabel(it, lookups);
                        const qty = it.quantity ?? 1;
                        const price = Number(it.subTotal ?? 0);

                        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${typeLabel}</td>
            <td style="text-align:center;">${qty}</td>
            <td style="text-align:right;">${price.toLocaleString()} đ</td>
          </tr>
        `;
                    }).join('')
                    : `
      <tr>
        <td colspan="4" style="text-align:center;color:#777;">
          Không có chi tiết
        </td>
      </tr>
    `;


            /* ---------- HTML ---------- */
            const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial; padding: 24px; color: #111; }
              h1 { text-align: center; margin-bottom: 4px; }
              .sub { text-align:center;color:#555;margin-bottom:20px; }
              .row { display:flex; justify-content:space-between; margin-bottom:6px; }
              .label { color:#555; }
              .value { font-weight:bold; }
              .box { border:1px solid #ddd; border-radius:8px; padding:12px; margin-top:12px; }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                font-size: 13px;
              }
              th {
                background: #f2f2f2;
                text-align: left;
              }

              .qr { margin-top: 24px; text-align: center; }
              .footer { margin-top: 32px; font-size: 12px; color: #777; text-align: center; }
            </style>
          </head>

          <body>
            <h1>PHIẾU ĐƠN HÀNG</h1>
            <div class="sub">ASMS</div>

            <div class="box">
              <div class="row">
                <div class="label">Mã đơn</div>
                <div class="value">${order?.orderCode ?? '-'}</div>
              </div>
              <div class="row">
                <div class="label">Khách hàng</div>
                <div class="value">${order?.customerName ?? '-'}</div>
              </div>
              <div class="row">
                <div class="label">Địa chỉ</div>
                <div class="value">${order?.address ?? order?.pickupAddress ?? '-'}</div>
              </div>
              <div class="row">
                <div class="label">Trạng thái</div>
                <div class="value">${mapStatusToVN(order?.status)}</div>
              </div>
              <div class="row">
                <div class="label">Ngày</div>
                <div class="value">${formatDate(order?.orderDate ?? order?.depositDate)}</div>
              </div>
            </div>

            <h3 style="margin-top:24px;">Chi tiết sản phẩm</h3>

            <table>
              <thead>
                <tr>
                  <th style="width:40px;">#</th>
                  <th>Sản phẩm</th>
                  <th style="width:80px;">SL</th>
                  <th style="width:120px;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${detailRows}
              </tbody>
            </table>

            <div style="margin-top:12px;text-align:right;font-weight:bold;">
              Tổng cộng: ${(totalPrice ?? 0).toLocaleString()} đ
            </div>

            <div class="qr">
              <img src="${qrUrl}" />
              <div style="margin-top:6px;font-size:12px;">
                Quét QR để xem thông tin đơn hàng
              </div>
            </div>

            <div class="footer">
              Phiếu được tạo từ ứng dụng ASMS
            </div>
          </body>
        </html>
      `;

            await Print.printAsync({ html });
        } catch (e) {
            console.error('printOrderPdf error', e);
            Alert.alert('Lỗi', 'Không thể in PDF.');
        }
    }, [order, details, totalPrice, formatDate, mapStatusToVN, lookups]);

    return (
        <Button
            mode="outlined"
            icon="printer"
            compact
            onPress={printOrderPdf}
        >
            In PDF
        </Button>
    );
}
