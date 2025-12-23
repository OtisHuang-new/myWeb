import { useState } from 'react';
function Pane() {
    const [content, setContent] = useState("");

    const handleSplit = () => {
        const start_line = "Học kỳ	Môn học	Nhóm lớp	Ngày thi	Loại thi	Cơ sở	Mã phòng	Thứ	Giờ bắt đầu	Tổng số phút	Cập nhật cuối cùng vào lúc";
        const end_line = "Trình bày từ dòng 1 đến 8 / 8 dòng";

        if (!content || typeof content.split !== 'function') {
            alert("Dữ liệu không đúng chuẩn");
            return;
          }
        
        const lines = content?.split('\n') || [];
        let startIdx = -1;
        for(let i = 0; i < lines.length; i++){
            if(lines[i] === start_line){
                startIdx = i;
                break;
            }
        }
        if(startIdx === -1){
            alert("Dữ liệu không đúng chuẩn");
            return;
        }else if(startIdx === lines.length - 1){
            alert("Không có Dữ liệu lịch thi");
            return;
        }
        startIdx++;
        return {'lines':lines, 'startIdx':startIdx, 'end_line':end_line};        
    }
    const createEventsToFile = () => {
        let {lines, startIdx, end_line} = handleSplit();
        let myCalendar = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MyReactApp//NONSGML v1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:${"Lịch thi " + lines[startIdx].substring(0,5)}\nX-WR-TIMEZONE:Asia/Ho_Chi_Minh\n`;
        const fileName = `myExam_${lines[startIdx].substring(0,5)}`;
        while(lines[startIdx] !== end_line && startIdx < lines.length){
            const line = lines[startIdx].split('\t');
            const toICS = (ngay, gio, themPhut = 0) => {
                const d = new Date(`${ngay}T${gio.replace('g', ':').padStart(5, '0')}:00+07:00`);
                const minutesToAdd = Number(themPhut); 
                if (!isNaN(minutesToAdd)) {
                    d.setMinutes(d.getMinutes() + minutesToAdd);
                }
                return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
            };
            
            let myEvent = `BEGIN:VEVENT\n`
                        + `UID:${line[0] + line[4] + line[1].split(" - ")[0]}@myExams.com\n`
                        + `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}\n`
                        + `SUMMARY:${"THI " + line[4] + " " + line[1].substring(line[1].indexOf(" - ") + 3, line[1].length)}\n`
                        + `DESCRIPTION:${"Cơ sở " + line[5] + " - Phòng " + line[6] + "\\nThời gian làm bài: " + line[9]}\n`
                        + `LOCATION:\n`
                        + `DTSTART:${toICS(line[3], line[8])}\n`
                        + `DTEND:${toICS(line[3], line[8], line[9])}\n`
                        + `STATUS:CONFIRMED\n`
                        + `END:VEVENT\n`;
            myCalendar += myEvent;
            startIdx++;
        }
        myCalendar += "END:VCALENDAR";
        console.log(myCalendar);

        
        const blob = new Blob([myCalendar], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    const CLIENT_ID = "594450533508-bkf8586tubie23v35bej23oo3tlu285l.apps.googleusercontent.com"; 
    const SCOPES = "https://www.googleapis.com/auth/calendar";
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
            let {lines, startIdx, end_line} = handleSplit();
            while(lines[startIdx] !== end_line && startIdx < lines.length){
                const line = lines[startIdx].split('\t');
                const toICS = (ngay, gio, themPhut = 0) => {
                    const d = new Date(`${ngay}T${gio.replace('g', ':').padStart(5, '0')}:00+07:00`);
                    const minutesToAdd = Number(themPhut); 
                    if (!isNaN(minutesToAdd)) {
                        d.setMinutes(d.getMinutes() + minutesToAdd);
                    }
                    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                };
                
                const myEvent = {
                    'summary' : `${"THI " + line[4] + " " + line[1].substring(line[1].indexOf(" - ") + 3, line[1].length)}`,
                    'start' : {
                        'dateTime': '',
                        'timeZone': 'Asia/Ho_Chi_Minh'
                    },
                    'end' : 
                };

                            + `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"}\n`
                            + `DESCRIPTION:${"Cơ sở " + line[5] + " - Phòng " + line[6] + "\\nThời gian làm bài: " + line[9]}\n`
                            + `LOCATION:\n`
                            + `DTSTART:${toICS(line[3], line[8])}\n`
                            + `DTEND:${toICS(line[3], line[8], line[9])}\n`
                            + `STATUS:CONFIRMED\n`
                            + `END:VEVENT\n`;
                startIdx++;
            }
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
        <>
        <div className="w-[400px] bg-white p-4 shadow-lg rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời khóa biểu của bạn:
            </label>
            
            <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)} 
                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Hãy nhập Thời khóa biểu vào đây..."
            ></textarea>
            
            <button 
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition" 
                onClick={createEventsToFile}
            >
                Lưu thời khóa biểu
            </button>
        </div>
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
        </>
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
export default Pane