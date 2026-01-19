import React, { useState, useRef } from 'react';
import { getAIPrompt } from '../utils/csvParser';

interface AIIngestionProps {
  onImport: (csv: string) => { success: boolean; count: number };
}

export const AIIngestion: React.FC<AIIngestionProps> = ({ onImport }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [isProcessing] = useState(false); // Reserved for future AI integration
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // For now, we'll just trigger the file input with camera
      // In a full implementation, we'd show a camera preview
      stream.getTracks().forEach(track => track.stop());
      
      if (fileInputRef.current) {
        fileInputRef.current.setAttribute('capture', 'environment');
        fileInputRef.current.click();
      }
    } catch {
      // Fall back to file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleImportCSV = () => {
    if (!csvResult.trim()) {
      alert('Please paste the CSV data from your AI analysis');
      return;
    }

    const result = onImport(csvResult);
    if (result.success) {
      alert(`Successfully imported ${result.count} items!`);
      setCsvResult('');
      setImagePreview(null);
    } else {
      alert('Failed to import. Please check the CSV format.');
    }
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(getAIPrompt());
    alert('Prompt copied to clipboard! Paste it in your AI chat with the image.');
  };

  return (
    <div className="ai-ingestion">
      <h2>📸 AI Inventory Import</h2>
      <p>Take a photo of your fridge or pantry and use AI to identify items.</p>

      <div className="ingestion-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Take or Upload a Photo</h3>
            <div className="photo-actions">
              <button className="btn btn-primary" onClick={handleCameraCapture}>
                📷 Use Camera
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️ Upload Photo
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Captured food items" />
              </div>
            )}
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Use AI to Analyze</h3>
            <p>Copy the prompt below and paste it in your preferred AI tool (ChatGPT, Claude, etc.) along with the image:</p>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              {showPrompt ? 'Hide Prompt' : 'Show AI Prompt'}
            </button>
            {showPrompt && (
              <div className="ai-prompt-box">
                <pre>{getAIPrompt()}</pre>
                <button className="btn btn-small" onClick={copyPromptToClipboard}>
                  📋 Copy Prompt
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>Paste the CSV Result</h3>
            <p>Copy the CSV output from the AI and paste it here:</p>
            <textarea
              value={csvResult}
              onChange={e => setCsvResult(e.target.value)}
              placeholder="item_name,quantity,unit,fiber_g,fat_g,carbs_g,protein_g,category
Greek Yogurt,1,cup,0,5,9,17,dairy
..."
              rows={10}
            />
            <button 
              className="btn btn-primary btn-large"
              onClick={handleImportCSV}
              disabled={isProcessing || !csvResult.trim()}
            >
              {isProcessing ? 'Processing...' : '📥 Import Items'}
            </button>
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h3>💡 Tips for Best Results</h3>
        <ul>
          <li>Take clear, well-lit photos</li>
          <li>Include all shelves and compartments</li>
          <li>Make sure labels are visible when possible</li>
          <li>Take multiple photos for large fridges/pantries</li>
        </ul>
      </div>
    </div>
  );
};
