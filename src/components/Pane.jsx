import { useState } from 'react';
function Pane() {
  const start_line = "Học kỳ	Môn học	Nhóm lớp	Ngày thi	Loại thi	Cơ sở	Mã phòng	Thứ	Giờ bắt đầu	Tổng số phút	Cập nhật cuối cùng vào lúc";
  const end_line = "Trình bày từ dòng 1 đến 8 / 8 dòng";
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSplit = () => {
    if (!content || typeof content.split !== 'function') {
      throw new Error("Dữ liệu không đúng chuẩn");
    }
    
    const lines = content?.split('\n') || [];
    let startIdx = lines.indexOf(start_line);
    let endIdx = lines.indexOf(end_line);

    if(startIdx === -1 || endIdx === -1){
      throw new Error("Dữ liệu không đúng chuẩn");
    }else if(startIdx === endIdx - 1){
      throw new Error("Không có Dữ liệu lịch thi");
    }

    startIdx++;
    if(lines[startIdx] === "")
      throw new Error("Dữ liệu không đúng chuẩn");
    
    return {'lines':lines, 'startIdx':startIdx, 'endIdx':endIdx};
  }
  const createEventsToFile = () => {
    try {
      const splited = handleSplit();
      let lines = splited.lines;
      let startIdx = splited.startIdx;
      let endIdx = splited.endIdx;

      let myCalendar = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MyReactApp//NONSGML v1.0//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:${"Lịch thi " + lines[startIdx].substring(0,5)}\nX-WR-TIMEZONE:Asia/Ho_Chi_Minh\n`;
      const fileName = `myExam_${lines[startIdx].substring(0,5)}`;
      for(let i = startIdx; i < endIdx; i++){
        const line = lines[i].split('\t');
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
      }
      myCalendar += "END:VCALENDAR";
      // console.log(myCalendar);

      
      const blob = new Blob([myCalendar], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch(error) {
      alert(error);
    };
  }

  const CLIENT_ID = "594450533508-bkf8586tubie23v35bej23oo3tlu285l.apps.googleusercontent.com"; 
  const SCOPES = "https://www.googleapis.com/auth/calendar";
  const [accessToken, setAccessToken] = useState(null);
  const [status, setStatus] = useState("Chưa kết nối");

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
    setIsLoading(true);
    try {
      const splited = handleSplit();
      let lines = splited.lines;
      let startIdx = splited.startIdx;
      let endIdx = splited.endIdx;

      // Create new Calendar
      const createCalRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'summary': `${"Lịch thi " + lines[startIdx].substring(0,5)}`, 
          'timeZone': 'Asia/Ho_Chi_Minh'
        })
      });

      const newCalendar = await createCalRes.json();
      const newCalendarId = newCalendar.id; 

      // Create Events
      let check = true;
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      for(let i = startIdx; i < endIdx; i++){
        const line = lines[startIdx].split('\t');
        const format = (ngay, gio, themPhut = 0) => {
          const d = new Date(`${ngay}T${gio.replace('g', ':').padStart(5, '0')}:00+07:00`);
          if (themPhut > 0) d.setMinutes(d.getMinutes() + Number(themPhut));

          const offset = "+07:00";
          const isoString = d.toLocaleString('sv-SE').replace(' ', 'T'); // YYYY-MM-DD HH:mm:ss
          return isoString + offset;
        };
        const myEvent = {
          'summary': `${"THI " + line[4] + " " + line[1].substring(line[1].indexOf(" - ") + 3, line[1].length)}`,
          'description': `Cơ sở ${line[5]} - Phòng ${line[6]}\nThời gian làm bài: ${line[9]}`,
          'start': {
            'dateTime': `${format(line[3], line[8])}`,
            'timeZone': 'Asia/Ho_Chi_Minh'
          },
          'end': {
            'dateTime': `${format(line[3], line[8], line[9])}`,
            'timeZone': 'Asia/Ho_Chi_Minh'
          },
        };

        const addEventRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${newCalendarId}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(myEvent)
        });
        await delay(2000);

        if(check) check = addEventRes.ok;

        startIdx++;
      }
      if(check)
        alert("Đã thêm lịch");
      else 
        alert("Thêm lịch không thành công");
    } catch (error) {
      alert(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="w-[400px] bg-white p-4 shadow-lg rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lịch thi của bạn:
        </label>
        
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)} 
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Hãy nhập Lịch thi vào đây..."
        ></textarea>
        
        <button 
          className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition" 
          onClick={createEventsToFile}
        >
          Tải lịch thi
        </button>
        <div className='p-[20px] items-center'>
          <p>Trạng thái: <strong>{status}</strong></p>
            
          {!accessToken ? (
            <button className="w-full px-[20px] py-[10px] text-[16px] cursor-pointer bg-[#4285F4] text-white border-none rounded-[5px] hover:bg-[#357ae8] transition-colors" onClick={handleConnect}>
              Kết nối với Google
            </button>
          ) : (
            <button 
              className={`w-full px-[20px] py-[10px] text-[16px] ${isLoading ? "bg-gray-300 cursor-not-allowed" : "bg-[#28a745] cursor-pointer hover:bg-[#357ae8]"} text-white border-none rounded-[5px] transition-colors`}
              onClick={createNewCalendarAndEvent}
              disabled={isLoading}
            >
              {isLoading ? (<> Đang xử lý ... </>) : (<>Thêm vào <strong>Google Calendar</strong></>)}
            </button>
          )}
        </div>  
        <div className='text-[13px] text-gray-400'>
          Nhấp {<a href="https://forms.gle/AyWeuChK2mMPAJL27" target="_blank" rel="noopener noreferrer" className='text-blue-400 hover:underline'>tại đây</a>} để gửi feedback cho mình nha, thank iu.
        </div>
      </div>
    </>
  );
}
export default Pane