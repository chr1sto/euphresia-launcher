!include installer.nsh

!include x64.nsh

!macro InstallVcRedist
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

!macro CopyGameFiles
  Var /GLOBAL PARENTDIR
  Var /GLOBAL PARENTDIR2

  !insertmacro GetParent
  ${GetParent} "$INSTDIR" $PARENTDIR
  ${ifNot} ${isUpdated}

    StrCpy $PARENTDIR "$PARENTDIR\Client"
    CreateDirectory "$PARENTDIR"

    CopyFiles /SILENT "$INSTDIR\client\binary" "$PARENTDIR\binary"

    CreateDirectory "$PARENTDIR\data"
    CreateDirectory "$PARENTDIR\Music"
    CreateDirectory "$PARENTDIR\Sound"
  ${endIf}

  ${GetParent} "$INSTDIR" $PARENTDIR2
  StrCpy $PARENTDIR2 "$PARENTDIR2\Client_PBE"
  ${If} ${FileExists} "$PARENTDIR2\*.*"
  ${Else}
    CreateDirectory "$PARENTDIR2"
    CreateDirectory "$PARENTDIR2\data"
    CreateDirectory "$PARENTDIR2\Music"
    CreateDirectory "$PARENTDIR2\Sound"
    CreateDirectory "$PARENTDIR2\binary"
  ${EndIf}

  RMDir /r "$INSTDIR\client"
!macroend

InitPluginsDir

${IfNot} ${Silent}
  SetDetailsPrint none
${endif}

StrCpy $appExe "$INSTDIR\${APP_EXECUTABLE_FILENAME}"

# must be called before uninstallOldVersion
!insertmacro setLinkVars

!ifdef ONE_CLICK
  !ifdef HEADER_ICO
    File /oname=$PLUGINSDIR\installerHeaderico.ico "${HEADER_ICO}"
  !endif
  ${IfNot} ${Silent}
    !ifdef HEADER_ICO
      SpiderBanner::Show /MODERN /ICON "$PLUGINSDIR\installerHeaderico.ico"
    !else
      SpiderBanner::Show /MODERN
    !endif

    FindWindow $0 "#32770" "" $hwndparent
    FindWindow $0 "#32770" "" $hwndparent $0
    GetDlgItem $0 $0 1000
    SendMessage $0 ${WM_SETTEXT} 0 "STR:$(installing)"
  ${endif}
  !insertmacro CHECK_APP_RUNNING
!else
  ${ifNot} ${UAC_IsInnerInstance}
    !insertmacro CHECK_APP_RUNNING
  ${endif}
!endif

Var /GLOBAL keepShortcuts
StrCpy $keepShortcuts "false"
!insertMacro setIsTryToKeepShortcuts
${if} $isTryToKeepShortcuts == "true"
  ReadRegStr $R1 SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" KeepShortcuts

  ${if} $R1 == "true"
  ${andIf} ${FileExists} "$appExe"
    StrCpy $keepShortcuts "true"
  ${endIf}
${endif}

!insertmacro uninstallOldVersion SHELL_CONTEXT
${if} $installMode == "all"
  !insertmacro uninstallOldVersion HKEY_CURRENT_USER
${endIf}

SetOutPath $INSTDIR

!ifdef UNINSTALLER_ICON
  File /oname=uninstallerIcon.ico "${UNINSTALLER_ICON}"
!endif

!insertmacro installApplicationFiles
!insertmacro registryAddInstallInfo
!insertmacro addStartMenuLink $keepShortcuts
!insertmacro addDesktopLink $keepShortcuts

${if} ${FileExists} "$newStartMenuLink"
  StrCpy $launchLink "$newStartMenuLink"
${else}
  StrCpy $launchLink "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
${endIf}

!ifmacrodef registerFileAssociations
  !insertmacro registerFileAssociations
!endif

!ifmacrodef customInstall
  !insertmacro customInstall
!endif

!insertmacro InstallVcRedist
!insertmacro CopyGameFiles

!macro doStartApp
  # otherwise app window will be in background
  HideWindow
  !insertmacro StartApp
!macroend

!ifdef ONE_CLICK
  # https://github.com/electron-userland/electron-builder/pull/3093#issuecomment-403734568
  !ifdef RUN_AFTER_FINISH
    ${ifNot} ${Silent}
    ${orIf} ${isForceRun}
      !insertmacro doStartApp
    ${endIf}
  !else
    ${if} ${isForceRun}
      !insertmacro doStartApp
    ${endIf}
  !endif
  !insertmacro quitSuccess
!else
  # for assisted installer run only if silent, because assisted installer has run after finish option
  ${if} ${isForceRun}
  ${andIf} ${Silent}
    !insertmacro doStartApp
  ${endIf}
!endif