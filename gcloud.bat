@echo off
set GCLOUD_SDK_PATH=%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin
call "%GCLOUD_SDK_PATH%\gcloud.cmd" %*
