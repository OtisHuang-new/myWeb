#include<iostream>
#include<windows.h> // Thư viện chứa SetConsoleOutputCP
#include<fstream>
#include<cstring>
using namespace std;
string start_line = "Học kỳ	Môn học	Nhóm lớp	Ngày thi	Loại thi	Cơ sở	Mã phòng	Thứ	Giờ bắt đầu	Tổng số phút	Cập nhật cuối cùng vào lúc";
string end_line = "Trình bày từ dòng 1 đến 8 / 8 dòng";
int main(){
    // Thiết lập Console xuất ra hệ UTF-8
    SetConsoleOutputCP(65001);
    ifstream inputFile("my_Exams.txt");
    string line;
    if (inputFile.is_open()) { // Kiểm tra xem file có mở thành công không
        do{
            getline(inputFile, line);
        }while(line != start_line);

        const char sep[2] = "\t";
        while(getline(inputFile, line) && line != end_line){
            char* str = line.data();
            char* token = strtok(str,sep);
            while(token){
                cout<<token<<endl;
                token = strtok(nullptr,sep);
            }
        }

    } else {
        cout << "Unable to open file!" << endl;
    }
}