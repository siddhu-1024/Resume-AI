import io
import pypdf

def extract_text_from_pdf(file_input):
    """
    Extracts text from a PDF file path or file-like byte stream using pypdf.
    Returns (text, page_count, metadata, error).
    """
    try:
        if isinstance(file_input, (bytes, bytearray)):
            stream = io.BytesIO(file_input)
            reader = pypdf.PdfReader(stream)
        elif isinstance(file_input, str):
            reader = pypdf.PdfReader(file_input)
        else:
            reader = pypdf.PdfReader(file_input)
            
        if reader.is_encrypted:
            try:
                reader.decrypt('')
            except Exception:
                return "", 0, {}, "PDF is password encrypted and cannot be read."
                
        page_count = len(reader.pages)
        if page_count == 0:
            return "", 0, {}, "PDF contains no pages."
            
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text.strip())
                
        full_text = "\n\n".join(text_parts).strip()
        
        metadata = {}
        if reader.metadata:
            for k, v in reader.metadata.items():
                if v:
                    metadata[str(k).replace('/', '')] = str(v)
                    
        if not full_text:
            return "", page_count, metadata, "Unable to extract selectable text. The document may be an image-only scan."
            
        return full_text, page_count, metadata, None
        
    except Exception as e:
        return "", 0, {}, f"Error reading PDF: {str(e)}"
