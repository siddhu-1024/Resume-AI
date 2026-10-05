from flask import Blueprint, request, jsonify
from backend.app.models.system import Setting
from backend.app.screening.matcher import DEFAULT_WEIGHTS, get_current_weights
from backend.app.services.demo_service import seed_demo_data, clear_demo_data
from backend.app.utils.logger import log_activity

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@settings_bp.route('', methods=['GET'])
def get_settings():
    """
    Returns application configuration, scoring weights, and demo status.
    """
    weights = get_current_weights()
    ai_provider = Setting.get_val('ai_provider', 'gemini')
    gemini_key = Setting.get_val('gemini_api_key', '')
    openai_key = Setting.get_val('openai_api_key', '')
    
    return jsonify({
        'scoring_weights': weights,
        'default_weights': DEFAULT_WEIGHTS,
        'ai_config': {
            'provider': ai_provider,
            'has_gemini_key': bool(gemini_key),
            'has_openai_key': bool(openai_key),
            'gemini_key_masked': f"...{gemini_key[-4:]}" if len(gemini_key) > 4 else ("Set" if gemini_key else "Not set"),
            'openai_key_masked': f"...{openai_key[-4:]}" if len(openai_key) > 4 else ("Set" if openai_key else "Not set")
        },
        'system': {
            'allowed_extensions': ['pdf', 'docx'],
            'max_file_size_mb': 16,
            'version': '1.0.0 (Production SaaS)'
        }
    })

@settings_bp.route('/weights', methods=['PUT'])
def update_weights():
    """
    Updates scoring weights with strict validation that total weight equals 100%.
    """
    data = request.get_json() or {}
    new_weights = data.get('weights', {})
    
    if not isinstance(new_weights, dict):
        return jsonify({'error': 'Invalid weights payload.'}), 400
        
    # Check all required keys exist and are numeric
    validated = {}
    for key in DEFAULT_WEIGHTS:
        val = new_weights.get(key)
        try:
            val_float = float(val)
            if val_float < 0:
                return jsonify({'error': f"Weight for '{key}' cannot be negative."}), 400
            validated[key] = val_float
        except (ValueError, TypeError):
            return jsonify({'error': f"Invalid numeric weight for '{key}'."}), 400
            
    total_sum = round(sum(validated.values()), 2)
    if total_sum != 100.0:
        return jsonify({
            'error': f"Total scoring weights must sum exactly to 100%. Current sum: {total_sum}%."
        }), 400
        
    Setting.set_val('scoring_weights', validated, description="Configurable multi-dimensional matching weights")
    
    log_activity(
        event_type="settings_updated",
        description=f"Updated scoring weights (sum: {total_sum}%)",
        entity_type="system"
    )
    
    return jsonify({
        'message': 'Scoring weights updated successfully.',
        'weights': validated
    })

@settings_bp.route('/weights/reset', methods=['POST'])
def reset_weights():
    """
    Resets scoring weights to factory defaults.
    """
    Setting.set_val('scoring_weights', DEFAULT_WEIGHTS, description="Default matching weights")
    return jsonify({
        'message': 'Scoring weights reset to factory defaults.',
        'weights': DEFAULT_WEIGHTS
    })

@settings_bp.route('/ai', methods=['PUT'])
def update_ai_settings():
    """
    Updates AI provider and optional API keys.
    """
    data = request.get_json() or {}
    provider = data.get('provider', 'gemini')
    gemini_key = data.get('gemini_api_key')
    openai_key = data.get('openai_api_key')
    
    if provider:
        Setting.set_val('ai_provider', provider)
    if gemini_key is not None:
        Setting.set_val('gemini_api_key', gemini_key.strip())
    if openai_key is not None:
        Setting.set_val('openai_api_key', openai_key.strip())
        
    return jsonify({'message': 'AI configuration saved successfully.'})

@settings_bp.route('/demo/seed', methods=['POST'])
def seed_demo():
    """
    Seeds rich demo jobs and candidates.
    """
    result = seed_demo_data()
    return jsonify(result)

@settings_bp.route('/demo/clear', methods=['POST'])
def clear_demo():
    """
    Clears all demo records.
    """
    result = clear_demo_data()
    return jsonify(result)
