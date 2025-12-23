import React, { useState } from 'react';

// 1. Dán Client ID bạn vừa copy từ Google Cloud vào đây
const CLIENT_ID = "594450533508-bkf8586tubie23v35bej23oo3tlu285l.apps.googleusercontent.com"; 

// Scope cho phép tạo sự kiện mới vào lịch
const SCOPES = "https://www.googleapis.com/auth/calendar";

function GoogleCalendarDemo() {
  const [accessToken, setAccessToken] = useState(null);
  const [status, setStatus] = useState("Chưa kết nối");

  // Hàm kích hoạt đăng nhập OAuth2
  const handleConnect = () => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse.access_token) {
          setAccessToken(tokenResponse.access_token);
          setStatus("Đã kết nối thành công!");
        }
      },
    });
    client.requestAccessToken();
  };

  const createNewCalendarAndEvent = async () => {
    if (!accessToken) return alert("Vui lòng kết nối Google trước!");

    try {
      // BƯỚC 1: TẠO LỊCH MỚI
      const createCalRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'summary': 'Lịch Thi Học Kỳ 1', // Tên bộ lịch mới
          'timeZone': 'Asia/Ho_Chi_Minh'
        })
      });

      const newCalendar = await createCalRes.json();
      const newCalendarId = newCalendar.id; // Đây là ID của bộ lịch vừa tạo
      console.log("Đã tạo lịch mới với ID:", newCalendarId);

      // BƯỚC 2: THÊM SỰ KIỆN VÀO LỊCH MỚI ĐÓ
      const event = {
        'summary': 'Thi Môn Hệ Điều Hành',
        'start': { 'dateTime': '2025-12-31T13:30:00+07:00', 'timeZone': 'Asia/Ho_Chi_Minh' },
        'end': { 'dateTime': '2025-12-31T15:30:00+07:00', 'timeZone': 'Asia/Ho_Chi_Minh' },
      };

      const addEventRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${newCalendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });

      if (addEventRes.ok) {
        alert(`Đã tạo lịch mới "${newCalendar.summary}" và thêm môn thi thành công!`);
      }

    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Demo Kết Nối Google Calendar</h2>
      <p>Trạng thái: <strong>{status}</strong></p>
      
      {!accessToken ? (
        <button onClick={handleConnect} style={btnStyle}>
          Bước 1: Kết nối Google
        </button>
      ) : (
        <button onClick={createNewCalendarAndEvent} style={{...btnStyle, backgroundColor: '#28a745'}}>
          Bước 2: Thêm Lịch Thi Mẫu
        </button>
      )}
    </div>
  );
}

const btnStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  cursor: 'pointer',
  backgroundColor: '#4285F4',
  color: 'white',
  border: 'none',
  borderRadius: '5px'
};

export default GoogleCalendarDemo;