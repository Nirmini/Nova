#include <windows.h>
#include <iostream>
#include <string>
#include <dwmapi.h>
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "user32.lib")

int main() {
    // Force dark mode (Windows 10+)
    BOOL useDark = TRUE;
    DwmSetWindowAttribute(GetConsoleWindow(), 20, &useDark, sizeof(useDark));

    // Change the console title
    SetConsoleTitleA("Nirmini Nova: DEVELOPMENT BRANCH Terminal");

    // Change working directory to executable location
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    std::string exeDir = exePath;
    exeDir = exeDir.substr(0, exeDir.find_last_of("\\/"));
    SetCurrentDirectoryA(exeDir.c_str());

    // Set environment variable for Node.js
    SetEnvironmentVariableA("NODE_OPTIONS", "--max-old-space-size=4096");

    // Instead of `cmd /c`, directly run npm via its executable
    std::string command = "cmd /c npm start";

    // Configure process startup info
    STARTUPINFOA si = { sizeof(si) };
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_SHOW; // ensure window shows up

    PROCESS_INFORMATION pi{};

    // Create the process in the same console window
    BOOL success = CreateProcessA(
        NULL,
        (LPSTR)command.c_str(),
        NULL, NULL, TRUE, // inherit console
        0,
        NULL, NULL,
        &si, &pi
    );

    if (!success) {
        DWORD err = GetLastError();
        std::cerr << "Failed to start process. Error: " << err << std::endl;
        std::string msg = "Error launching npm start. Code: " + std::to_string(err);
        MessageBoxA(NULL, msg.c_str(), "Nirmini Nova", MB_OK | MB_ICONERROR);
        return 1;
    }

    // Wait for the child process (npm) to finish
    WaitForSingleObject(pi.hProcess, INFINITE);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return 0;
}
