// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};

// 喂养记录结构
#[derive(Debug, Clone, Serialize, Deserialize)]
struct FeedingRecord {
    #[serde(default)]
    id: u64,
    feeding_type: String,
    amount: u32,
    duration: u32,
    feeding_time: String,
    notes: String,
}

// 应用状态
struct AppState {
    records: Mutex<Vec<FeedingRecord>>,
    data_file: PathBuf,
}

impl AppState {
    fn new(data_file: PathBuf) -> Self {
        let records = if data_file.exists() {
            fs::read_to_string(&data_file)
                .ok()
                .and_then(|content| serde_json::from_str(&content).ok())
                .unwrap_or_else(Vec::new)
        } else {
            Vec::new()
        };

        AppState {
            records: Mutex::new(records),
            data_file,
        }
    }

    fn save(&self) -> Result<(), String> {
        let records = self.records.lock().unwrap();
        let json = serde_json::to_string_pretty(&*records)
            .map_err(|e| format!("序列化失败: {}", e))?;

        if let Some(parent) = self.data_file.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        }

        fs::write(&self.data_file, json)
            .map_err(|e| format!("保存文件失败: {}", e))?;

        Ok(())
    }
}

// 添加喂养记录
#[tauri::command]
fn add_feeding_record(
    state: State<AppState>,
    record: FeedingRecord,
) -> Result<FeedingRecord, String> {
    let mut records = state.records.lock().unwrap();

    // 生成新 ID
    let new_id = records.iter().map(|r| r.id).max().unwrap_or(0) + 1;

    let new_record = FeedingRecord {
        id: new_id,
        ..record
    };

    records.push(new_record.clone());
    drop(records);

    state.save()?;

    Ok(new_record)
}

// 获取所有记录
#[tauri::command]
fn get_feeding_records(state: State<AppState>) -> Result<Vec<FeedingRecord>, String> {
    let records = state.records.lock().unwrap();
    Ok(records.clone())
}

// 删除记录
#[tauri::command]
fn delete_feeding_record(state: State<AppState>, id: u64) -> Result<(), String> {
    let mut records = state.records.lock().unwrap();
    records.retain(|r| r.id != id);
    drop(records);

    state.save()?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取应用数据目录
            let app_dir = app.path().app_data_dir()
                .unwrap_or_else(|_| {
                    let mut path = PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| ".".to_string()));
                    path.push(".baby-feeding-tracker");
                    path
                });

            let data_file = app_dir.join("feeding_records.json");
            app.manage(AppState::new(data_file));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            add_feeding_record,
            get_feeding_records,
            delete_feeding_record
        ])
        .run(tauri::generate_context!())
        .expect("启动应用失败");
}
