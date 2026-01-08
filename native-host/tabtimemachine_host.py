#!/usr/bin/env python3
"""
TabTimeMachine Native Messaging Host for Windows
Handles file writing and folder selection for the TabTimeMachine extension
"""

import sys
import json
import struct
import os
import base64
from pathlib import Path
import tkinter as tk
from tkinter import filedialog
from datetime import datetime

def send_message(message):
    """Send a message to the extension"""
    encoded_content = json.dumps(message).encode('utf-8')
    encoded_length = struct.pack('I', len(encoded_content))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.buffer.flush()

def read_message():
    """Read a message from the extension"""
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)

def select_folder():
    """Show a folder selection dialog"""
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    
    folder = filedialog.askdirectory(
        title='Select TabTimeMachine Output Folder',
        mustexist=True
    )
    
    root.destroy()
    return folder

def write_session_data(output_folder, timestamp, session_data):
    """Write session JSON atomically"""
    filename = f"{timestamp}_session.json"
    filepath = Path(output_folder) / filename
    temp_filepath = Path(output_folder) / f".{filename}.tmp"
    
    try:
        # Write to temp file first
        with open(temp_filepath, 'w', encoding='utf-8') as f:
            json.dump(session_data, f, indent=2)
        
        # Atomic rename
        temp_filepath.replace(filepath)
        return str(filepath)
    except Exception as e:
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise e

def write_pdf_files(output_folder, timestamp, pdf_data, pdf_mode):
    """Write PDF files atomically"""
    pdf_files = []
    
    try:
        if pdf_mode == 'merged' and pdf_data.get('merged'):
            # Write merged PDF
            filename = f"{timestamp}_merged.pdf"
            filepath = Path(output_folder) / filename
            temp_filepath = Path(output_folder) / f".{filename}.tmp"
            
            with open(temp_filepath, 'wb') as f:
                for pdf_item in pdf_data['pdfs']:
                    if pdf_item['pdfData']:
                        pdf_bytes = base64.b64decode(pdf_item['pdfData'])
                        f.write(pdf_bytes)
            
            temp_filepath.replace(filepath)
            pdf_files.append(str(filepath))
        else:
            # Write individual PDFs
            for pdf_item in pdf_data:
                if not pdf_item.get('pdfData'):
                    continue
                
                # Sanitize filename
                safe_title = "".join(c for c in pdf_item['title'] if c.isalnum() or c in (' ', '-', '_'))[:50]
                filename = f"{timestamp}_tab{pdf_item['tabId']}_{safe_title}.pdf"
                filepath = Path(output_folder) / filename
                temp_filepath = Path(output_folder) / f".{filename}.tmp"
                
                pdf_bytes = base64.b64decode(pdf_item['pdfData'])
                
                with open(temp_filepath, 'wb') as f:
                    f.write(pdf_bytes)
                
                temp_filepath.replace(filepath)
                pdf_files.append(str(filepath))
        
        return pdf_files
    except Exception as e:
        # Clean up any temp files
        for temp_file in Path(output_folder).glob('.*.tmp'):
            try:
                temp_file.unlink()
            except:
                pass
        raise e

def handle_message(message):
    """Process incoming message from extension"""
    action = message.get('action')
    
    if action == 'selectFolder':
        folder = select_folder()
        return {'success': True, 'folder': folder if folder else ''}
    
    elif message.get('sessionData'):
        # Session capture request
        output_folder = message.get('outputFolder', '')
        if not output_folder:
            return {'success': False, 'error': 'No output folder specified'}
        
        if not os.path.exists(output_folder):
            try:
                os.makedirs(output_folder, exist_ok=True)
            except Exception as e:
                return {'success': False, 'error': f'Failed to create output folder: {str(e)}'}
        
        timestamp = message.get('timestamp')
        session_data = message.get('sessionData')
        pdf_data = message.get('pdfData')
        pdf_mode = message.get('pdfMode', 'per-tab')
        
        try:
            # Write session JSON
            session_file = write_session_data(output_folder, timestamp, session_data)
            
            # Write PDFs
            pdf_files = []
            if pdf_data:
                pdf_files = write_pdf_files(output_folder, timestamp, pdf_data, pdf_mode)
            
            return {
                'success': True,
                'sessionFile': session_file,
                'pdfFiles': pdf_files,
                'pdfCount': len(pdf_files)
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    else:
        return {'success': False, 'error': 'Unknown action'}

def main():
    """Main message loop"""
    try:
        while True:
            message = read_message()
            response = handle_message(message)
            send_message(response)
    except Exception as e:
        send_message({'success': False, 'error': str(e)})
        sys.exit(1)

if __name__ == '__main__':
    main()
