export function buildRentalContractHtml({
  order,
  details = [],
  customer,
  formatDate,
  getDetailTypeLabel, 
}) {
  const contractNo = order?.orderCode ?? '—';
  const signingDate = formatDate(new Date());

  const lesseeName =
    customer?.name ??
    order?.customerName ??
    '……………………';

  const detailRows =
    details.length > 0
      ? details.map((it, idx) => `
        <tr>
           <td>${idx + 1}</td>
    <td>${getDetailTypeLabel(it)}</td>
    <td style="text-align:center;">${it.quantity ?? 1}</td>
  </tr>
      `).join('')
      : `
        <tr>
          <td colspan="3" style="text-align:center;">Không có chi tiết</td>
        </tr>
      `;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    font-family: "Times New Roman";
    padding: 36px;
    font-size: 14px;
    line-height: 1.6;
    color: #000;
  }
  h1 { text-align:center; margin-bottom:4px; }
  h2 { text-align:center; font-size:16px; margin-top:0; }
  h3 { margin-top:24px; }
  .center { text-align:center; }
  .bold { font-weight:bold; }
  table {
    width:100%;
    border-collapse:collapse;
    margin-top:12px;
  }
  th, td {
    border:1px solid #000;
    padding:6px;
  }
  .sign {
    margin-top:80px;
    display:flex;
    justify-content:space-between;
  }
</style>
</head>

<body>

<h1>HỢP ĐỒNG THUÊ KHO</h1>


<p class="center">
<b>Số hợp đồng:</b> ${contractNo}<br/>
</p>

<p class="center">
<b>Ngày ký:</b> ${signingDate}<br/>
</p>

<h3>I. THÔNG TIN CÁC BÊN</h3>

<p>
<b>BÊN A (Bên cho thuê):</b> CÔNG TY LƯU TRỮ ASMS<br/>
</p>

<p>
<b>BÊN B (Bên thuê):</b> ${lesseeName}<br/>
</p>

<h3>II. THÔNG TIN ĐƠN HÀNG</h3>

<p>
<b>Mã đơn:</b> ${order?.orderCode ?? '-'}<br/>
<b>Ngày đặt:</b> ${formatDate(order?.orderDate)}
</p>

<table>
<thead>
<tr>
  <th>#</th>
  <th>Loại thuê </th>
  <th>SL</th>
</tr>
</thead>
<tbody>
${detailRows}
</tbody>
</table>

<h3>III. ĐIỀU KHOẢN HỢP ĐỒNG</h3>

${buildArticle(1, 'Gia hạn hợp đồng',
'Hợp đồng chỉ được gia hạn khi chưa quá hạn. Khi gia hạn sẽ tạo chu kỳ mới và không cộng dồn ngày cũ.')}

${buildArticle(2, 'Không hoàn tiền kỳ đã trả',
'Khi khách kết thúc hợp đồng sớm hoặc trả phòng trước hạn, hệ thống không hoàn tiền cho kỳ đã thanh toán.')}

${buildArticle(3, 'Scan QR Box khi nhập kho',
'Nhân viên kho bắt buộc scan QR Box để xác nhận nhập kho. Không scan thì không cho nhập.')}


${buildArticle(4, 'Xác nhận người lấy hàng',
'Nhân viên phải xác nhận đúng người nhận, đối chiếu thông tin thuê và giấy ủy quyền (nếu có).')}

${buildArticle(5, 'Lập biên bản hiện trường',
'Khi phát hiện mất mát, hư hỏng hoặc sai lệch hàng hóa, nhân viên kho bắt buộc lập biên bản hiện trường và ghi log hệ thống.')}

${buildArticle(6, 'Điểm nhận và điểm giao',
'Điểm nhận hàng (A) là kho. Điểm giao hàng (B) là địa chỉ khách hàng.')}

${buildArticle(7, 'Khách tự mang thùng ra kho',
'Hệ thống vẫn áp dụng quy trình nhập kho và scan QR Box như bình thường.')}

${buildArticle(8, 'Chu kỳ và thanh toán',
'Chu kỳ thuê: Tuần hoặc Tháng. Thanh toán trả trước hoàn toàn theo chu kỳ.')}



${buildArticle(9, 'Hiển thị hạn mức bồi thường',
'Hiển thị hạn mức giá trị bồi thường.')}

${buildArticle(10, 'Phí vận chuyển',
'Tính phí theo km và số thùng.')}

${buildArticle(11, 'Thanh toán theo chu kỳ',
'Thanh toán theo tuần hoặc tháng.')}

${buildArticle(12, 'Phụ phí sản phẩm đặc biệt',
'Hàng dễ vỡ, Hàng điện tử, Hàng nặng, Hàng lạnh.')}

${buildArticle(13, 'Hàng rơi vỡ trên đường',
'Trách nhiệm nhân viên và sẽ đền bù cho khách hàng 100% giá thuê 1 tháng nếu khách hàng có mua gói bảo hiểm.')}


${buildArticle(14, 'Hàng quá hạn',
'Chuyển sang phòng quá hạn.')}

${buildArticle(15, 'Cảnh báo số lượng kệ tối đa',
'Cảnh báo số lượng kệ mỗi phòng.')}

${buildArticle(16, 'Cảnh báo kích thước thùng',
'Cảnh báo thùng phù hợp phòng/kệ.')}

${buildArticle(17, 'Tính giá thuê kho',
'Tính dựa trên phòng, kệ, thùng, dịch vụ.')}



${buildArticle(18, 'Kiểm tra thùng vào kệ',
'Check kích cỡ và số lượng trống.')}

${buildArticle(19, 'Kết thúc hợp đồng',
'Kết thúc bình thường, mất đồ, quá hạn, cháy nổ theo hợp đồng.')}

<div class="sign">
  <div>
    <b>ĐẠI DIỆN BÊN A</b><br/>
    Chức danh: Nhân viên
  </div>

  <div>
    <b>ĐẠI DIỆN BÊN B</b><br/>
    Chức danh: Khách hàng
  </div>
</div>



</body>
</html>
`;
}

function buildArticle(no, title, content) {
  return `
<p><b>Điều ${no}. ${title}</b><br/>
<p>${content}</p>
`;
}
