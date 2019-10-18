!include x64.nsh

!macro customInstall
    ${If} ${RunningX64}

        ReadRegStr $1 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X64" "Installed"

        StrCmp $1 1 installed

    ${Else}

        ReadRegStr $1 HKLM "SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\X86" "Installed"

        StrCmp $1 1 installed

    ${EndIf}

    ExecWait "dependencies/VC_redist.x86.exe"

    installed:
!macroend