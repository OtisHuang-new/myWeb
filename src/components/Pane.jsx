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
                        + `SUMMARY:${"THI " + line[4] + " " + line[1].split(" - ")[1]}\n`
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
                placeholder="Hãy gõ gì đó ở đây..."
            ></textarea>
            
            <button 
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition" 
                onClick={handleSplit}
            >
                Lưu thời khóa biểu
            </button>
        </div>
        </>
    );
}

export default Pane