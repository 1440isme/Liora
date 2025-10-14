// Order Detail JavaScript
function cancelOrder(orderId) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
        const token = localStorage.getItem('access_token');
        if (!token) {
            alert('Vui lòng đăng nhập để thực hiện thao tác này');
            return;
        }

        fetch(`/api/user/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Hủy đơn hàng thành công!');
                window.location.reload();
            } else {
                return response.json().then(errorData => {
                    alert('Lỗi: ' + (errorData.message || 'Không thể hủy đơn hàng'));
                });
            }
        })
        .catch(error => {
            alert('Có lỗi xảy ra khi hủy đơn hàng');
        });
    }
}

function reorderOrder(orderId) {
    alert('Tính năng mua lại sẽ được cập nhật sớm');
}
