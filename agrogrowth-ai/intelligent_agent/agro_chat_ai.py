import re
import json
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class AgroChatAI:
    """
    Advanced Agricultural Chat AI Assistant
    
    Features:
    - Natural language understanding for farming queries
    - Context-aware conversation management
    - Agricultural knowledge base integration
    - Multi-language support (Arabic/English)
    - Expert advice generation
    - Real-time problem solving
    """
    
    def __init__(self):
        self.conversation_history = []
        self.user_context = {}
        self.confidence_threshold = 0.7
        
        # Agricultural knowledge base
        self.knowledge_base = {
            'crops': {
                'olive': {
                    'name_ar': 'زيتون',
                    'planting_season': 'مارس-أبريل، أكتوبر-نوفمبر',
                    'harvest_season': 'أكتوبر-ديسمبر',
                    'water_needs': 'منخفضة إلى متوسطة',
                    'soil_type': 'تربة جيدة التصريف، pH 6.5-7.5',
                    'common_diseases': ['تبقع أوراق الزيتون', 'ذبابة الزيتون', 'عين الطاووس'],
                    'fertilizer_needs': 'نيتروجين معتدل، فوسفور عالي، بوتاسيوم متوسط',
                    'climate': 'مناخ متوسطي معتدل'
                },
                'wheat': {
                    'name_ar': 'قمح',
                    'planting_season': 'نوفمبر-ديسمبر',
                    'harvest_season': 'مايو-يونيو', 
                    'water_needs': 'متوسطة',
                    'soil_type': 'تربة طينية جيدة، pH 6.0-7.0',
                    'common_diseases': ['صدأ القمح', 'البياض الدقيقي', 'تبقع الأوراق'],
                    'fertilizer_needs': 'نيتروجين عالي، فوسفور متوسط، بوتاسيوم منخفض',
                    'climate': 'مناخ بارد نسبياً في فصل النمو'
                },
                'tomato': {
                    'name_ar': 'طماطم',
                    'planting_season': 'سبتمبر-فبراير',
                    'harvest_season': 'ديسمبر-يونيو',
                    'water_needs': 'عالية',
                    'soil_type': 'تربة غنية جيدة التصريف، pH 6.0-6.8',
                    'common_diseases': ['اللفحة المتأخرة', 'الذبول البكتيري', 'فيروس موزايك'],
                    'fertilizer_needs': 'نيتروجين عالي، فوسفور عالي، بوتاسيوم عالي',
                    'climate': 'مناخ دافئ معتدل'
                },
                'citrus': {
                    'name_ar': 'حمضيات',
                    'planting_season': 'مارس-أبريل',
                    'harvest_season': 'نوفمبر-فبراير',
                    'water_needs': 'متوسطة إلى عالية',
                    'soil_type': 'تربة جيدة التصريف، pH 6.0-7.5',
                    'common_diseases': ['القرمز', 'تصمغ الحمضيات', 'أنثراكنوز'],
                    'fertilizer_needs': 'نيتروجين متوسط، فوسفور متوسط، بوتاسيوم عالي',
                    'climate': 'مناخ شبه استوائي'
                }
            },
            
            'diseases': {
                'تبقع أوراق الزيتون': {
                    'symptoms': ['بقع دائرية على الأوراق', 'اصفرار الأوراق', 'تساقط الأوراق'],
                    'treatment': ['رش بمبيد نحاسي', 'تحسين التهوية', 'إزالة الأوراق المصابة'],
                    'prevention': ['تقليم منتظم', 'تجنب الري الورقي', 'تعقيم الأدوات']
                },
                'صدأ القمح': {
                    'symptoms': ['بقع برتقالية على الأوراق', 'مسحوق برتقالي', 'ضعف النمو'],
                    'treatment': ['مبيدات فطرية جهازية', 'أصناف مقاومة', 'تسميد متوازن'],
                    'prevention': ['دورة زراعية', 'بذور معتمدة', 'مراقبة مبكرة']
                },
                'اللفحة المتأخرة': {
                    'symptoms': ['بقع مائية على الأوراق', 'عفن رمادي', 'تدهور الثمار'],
                    'treatment': ['مبيدات نحاسية', 'تقليل الرطوبة', 'تحسين التهوية'],
                    'prevention': ['زراعة في مكان مشمس', 'تجنب الري الورقي', 'مراقبة الطقس']
                }
            },
            
            'fertilizers': {
                'نيتروجين': {
                    'function': 'نمو الأوراق والسيقان',
                    'deficiency_signs': ['اصفرار الأوراق', 'ضعف النمو', 'أوراق صغيرة'],
                    'sources': ['يوريا', 'نترات أمونيوم', 'سلفات أمونيوم'],
                    'application_timing': 'في بداية موسم النمو'
                },
                'فوسفور': {
                    'function': 'تطوير الجذور والأزهار',
                    'deficiency_signs': ['أوراق بنفسجية', 'ضعف الإزهار', 'نمو بطيء للجذور'],
                    'sources': ['سوبر فوسفات', 'فوسفات أحادية', 'فوسفات صخري'],
                    'application_timing': 'قبل الزراعة وأثناء الإزهار'
                },
                'بوتاسيوم': {
                    'function': 'مقاومة الأمراض وجودة الثمار',
                    'deficiency_signs': ['حروق أطراف الأوراق', 'ثمار صغيرة', 'ضعف المقاومة'],
                    'sources': ['كل��ريد بوتاسيوم', 'سلفات بوتاسيوم', 'نترات بوتاسيوم'],
                    'application_timing': 'أثناء تكوين الثمار'
                }
            },
            
            'irrigation': {
                'drip_irrigation': {
                    'advantages': ['توفير المياه', 'تقليل الأعشاب', 'تسميد دقيق'],
                    'suitable_crops': ['طماطم', 'خيار', 'حمضيات', 'زيتون'],
                    'maintenance': ['تنظيف الفلاتر', 'فحص النقاطات', 'ضبط الضغط']
                },
                'sprinkler_irrigation': {
                    'advantages': ['تغطية واسعة', 'تبريد النباتات', 'سهولة التشغيل'],
                    'suitable_crops': ['قمح', 'شعير', 'برسيم', 'خضروات ورقية'],
                    'maintenance': ['فحص الرشاشات', 'ضبط التوزيع', 'صيانة المضخات']
                }
            }
        }
        
        # Intent recognition patterns
        self.intent_patterns = {
            'disease_diagnosis': [
                r'مرض|أمراض|مشكلة|عدوى|إصابة|فطر|بكتيريا|فيروس',
                r'أوراق صفراء|بقع|تساقط|ذبول|عفن|تدهور',
                r'ما هذا المرض|كيف أعالج|ما العلاج'
            ],
            'fertilizer_advice': [
                r'سماد|تسميد|تغذية|عناصر غذائية|نيتروجين|فوسفور|بوتاسيوم',
                r'نقص عناصر|أوراق صفراء|ضعف نمو|قلة إنتاج',
                r'متى أسمد|كمية السماد|نوع السماد'
            ],
            'irrigation_advice': [
                r'ري|مياه|سقي|جفاف|رطوبة',
                r'نظام ري|ري بالتنقيط|ري بالرش|كمية المياه',
                r'متى أروي|طريقة الري|توفير المياه'
            ],
            'planting_advice': [
                r'زراعة|غرس|بذر|شتل|موعد زراعة',
                r'أفضل وقت|موسم|متى أزرع|كيف أزرع',
                r'مسافات زراعة|عمق بذور|تحضير تربة'
            ],
            'harvest_advice': [
                r'حصاد|قطف|جني|نضج|قطاف',
                r'موعد حصاد|علامات النضج|طريقة حصاد',
                r'تخزين|حفظ|بعد الحصاد'
            ],
            'pest_control': [
                r'آفة|آفات|حشرة|حشرات|دودة|يرقة',
                r'مبيد|مكافحة|قتل|طرد|منع',
                r'مقاومة طبيعية|مكافحة حيوية|مبيد عضوي'
            ]
        }
        
    def process_query(self, 
                     user_message: str, 
                     user_context: Dict[str, Any] = None,
                     conversation_id: str = None) -> Dict[str, Any]:
        """
        Process user query and generate intelligent response
        
        Args:
            user_message: User's question or message
            user_context: Additional context (location, crop type, etc.)
            conversation_id: Conversation identifier
            
        Returns:
            Comprehensive response with advice and recommendations
        """
        try:
            # Update context
            if user_context:
                self.user_context.update(user_context)
            
            # Detect intent
            intent = self._detect_intent(user_message)
            
            # Extract entities (crops, diseases, etc.)
            entities = self._extract_entities(user_message)
            
            # Generate response based on intent and entities
            response = self._generate_response(intent, entities, user_message)
            
            # Store conversation history
            self.conversation_history.append({
                'user_message': user_message,
                'intent': intent,
                'entities': entities,
                'response': response,
                'timestamp': datetime.now().isoformat(),
                'conversation_id': conversation_id
            })
            
            return {
                'success': True,
                'response': response,
                'intent': intent,
                'entities': entities,
                'confidence': response.get('confidence', 0.8),
                'conversation_id': conversation_id,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {
                'success': False,
                'error': f"Query processing failed: {str(e)}",
                'response': {
                    'text': 'عذراً، حدث خطأ في معالجة استفسارك. يرجى المحاولة مرة أخرى.',
                    'type': 'error'
                }
            }
    
    def _detect_intent(self, message: str) -> str:
        """Detect user intent from message"""
        message_lower = message.lower()
        
        intent_scores = {}
        
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, message_lower))
                score += matches
            intent_scores[intent] = score
        
        # Return intent with highest score, or 'general' if no clear intent
        if intent_scores and max(intent_scores.values()) > 0:
            return max(intent_scores, key=intent_scores.get)
        else:
            return 'general_inquiry'
    
    def _extract_entities(self, message: str) -> Dict[str, List[str]]:
        """Extract entities like crops, diseases, fertilizers from message"""
        entities = {
            'crops': [],
            'diseases': [],
            'fertilizers': [],
            'irrigation_types': []
        }
        
        message_lower = message.lower()
        
        # Extract crops
        for crop, info in self.knowledge_base['crops'].items():
            if crop in message_lower or info['name_ar'] in message_lower:
                entities['crops'].append(crop)
        
        # Extract diseases
        for disease in self.knowledge_base['diseases'].keys():
            if disease in message_lower:
                entities['diseases'].append(disease)
        
        # Extract fertilizers
        for fertilizer in self.knowledge_base['fertilizers'].keys():
            if fertilizer in message_lower:
                entities['fertilizers'].append(fertilizer)
        
        # Extract irrigation types
        irrigation_keywords = {
            'تنقيط': 'drip_irrigation',
            'رش': 'sprinkler_irrigation',
            'غمر': 'flood_irrigation',
            'ري محوري': 'center_pivot'
        }
        
        for keyword, irrigation_type in irrigation_keywords.items():
            if keyword in message_lower:
                entities['irrigation_types'].append(irrigation_type)
        
        return entities
    
    def _generate_response(self, intent: str, entities: Dict, original_message: str) -> Dict[str, Any]:
        """Generate appropriate response based on intent and entities"""
        
        if intent == 'disease_diagnosis':
            return self._handle_disease_diagnosis(entities, original_message)
        elif intent == 'fertilizer_advice':
            return self._handle_fertilizer_advice(entities, original_message)
        elif intent == 'irrigation_advice':
            return self._handle_irrigation_advice(entities, original_message)
        elif intent == 'planting_advice':
            return self._handle_planting_advice(entities, original_message)
        elif intent == 'harvest_advice':
            return self._handle_harvest_advice(entities, original_message)
        elif intent == 'pest_control':
            return self._handle_pest_control(entities, original_message)
        else:
            return self._handle_general_inquiry(entities, original_message)
    
    def _handle_disease_diagnosis(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle disease diagnosis queries"""
        
        if entities['diseases']:
            # Specific disease mentioned
            disease = entities['diseases'][0]
            disease_info = self.knowledge_base['diseases'].get(disease, {})
            
            response_text = f"مرض {disease}:\n\n"
            response_text += "الأعراض:\n"
            for symptom in disease_info.get('symptoms', []):
                response_text += f"• {symptom}\n"
            
            response_text += "\nالعلاج الموصى به:\n"
            for treatment in disease_info.get('treatment', []):
                response_text += f"• {treatment}\n"
            
            response_text += "\nالوقاية:\n"
            for prevention in disease_info.get('prevention', []):
                response_text += f"• {prevention}\n"
            
            recommendations = [
                {
                    'type': 'immediate_action',
                    'title': 'إجراء فوري',
                    'description': disease_info.get('treatment', ['استشارة متخصص'])[0]
                },
                {
                    'type': 'prevention',
                    'title': 'الوقاية المستقبلية',
                    'description': disease_info.get('prevention', ['مراقبة منتظمة'])[0]
                }
            ]
            
        elif entities['crops']:
            # Crop mentioned, provide general disease info for that crop
            crop = entities['crops'][0]
            crop_info = self.knowledge_base['crops'].get(crop, {})
            
            response_text = f"الأمراض الشائعة لمحصول {crop_info.get('name_ar', crop)}:\n\n"
            
            for disease in crop_info.get('common_diseases', []):
                response_text += f"• {disease}\n"
            
            response_text += "\nللحصول على تشخيص دقيق، يرجى:\n"
            response_text += "• رفع صور واضحة للأوراق والنباتات المصابة\n"
            response_text += "• وصف الأعراض بالتفصيل\n"
            response_text += "• ذكر تاريخ ظهور الأعراض\n"
            
            recommendations = [
                {
                    'type': 'diagnosis',
                    'title': 'تشخيص بالصور',
                    'description': 'استخدم خدمة تشخيص الأمراض بالذكاء الاصطناعي'
                }
            ]
        else:
            # General disease inquiry
            response_text = "لتشخيص الأمراض النباتية بدقة، أحتاج إلى معرفة:\n\n"
            response_text += "1. نوع المحصول أو النبات\n"
            response_text += "2. وصف الأعراض المرئية\n"
            response_text += "3. جزء النبات المصاب (أوراق، ساق، ثمار، جذور)\n"
            response_text += "4. الظروف الجوية الأخيرة\n"
            response_text += "5. عمليات الري والتسميد المؤخرة\n\n"
            response_text += "يمكنك أيضاً رفع صور للنبات المصاب للحصول على تشخيص أدق."
            
            recommendations = [
                {
                    'type': 'information_needed',
                    'title': 'معلومات مطلوبة',
                    'description': 'حدد نوع المحصول والأعراض المرئية'
                }
            ]
        
        return {
            'text': response_text,
            'type': 'disease_diagnosis',
            'recommendations': recommendations,
            'confidence': 0.85,
            'follow_up_questions': [
                'هل تحتاج إلى معلومات عن المبيدات المناسبة؟',
                'هل تريد نصائح للوقاية من هذا المرض؟'
            ]
        }
    
    def _handle_fertilizer_advice(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle fertilizer and nutrition advice"""
        
        if entities['fertilizers']:
            # Specific fertilizer mentioned
            fertilizer = entities['fertilizers'][0]
            fert_info = self.knowledge_base['fertilizers'].get(fertilizer, {})
            
            response_text = f"معلومات عن {fertilizer}:\n\n"
            response_text += f"الوظيفة: {fert_info.get('function', '')}\n\n"
            
            response_text += "علامات النقص:\n"
            for sign in fert_info.get('deficiency_signs', []):
                response_text += f"• {sign}\n"
            
            response_text += "\nمصادر هذا العنصر:\n"
            for source in fert_info.get('sources', []):
                response_text += f"• {source}\n"
            
            response_text += f"\nأفضل وقت للتطبيق: {fert_info.get('application_timing', '')}"
            
        elif entities['crops']:
            # Crop mentioned, provide fertilizer recommendations
            crop = entities['crops'][0]
            crop_info = self.knowledge_base['crops'].get(crop, {})
            
            response_text = f"احتياجات التسميد لمحصول {crop_info.get('name_ar', crop)}:\n\n"
            response_text += f"التوصية العامة: {crop_info.get('fertilizer_needs', '')}\n\n"
            
            response_text += "جدول التسميد الموصى به:\n"
            response_text += "• النيتروجين: في بداية موسم النمو\n"
            response_text += "• الفوسفور: قبل الزراعة وأثناء الإزهار\n"
            response_text += "• البوتاسيوم: أثناء تكوين الثمار\n\n"
            
            response_text += "نصائح مهمة:\n"
            response_text += "• اختبار التربة قبل التسميد\n"
            response_text += "• تطبيق الأسمدة حسب نتائج التحليل\n"
            response_text += "• تجنب الإفراط في التسميد"
            
        else:
            # General fertilizer inquiry
            response_text = "أسس التسميد السليم:\n\n"
            response_text += "1. العناصر الأساسية (NPK):\n"
            response_text += "   • النيتروجين (N): نمو الأوراق\n"
            response_text += "   • الفوسفور (P): تطوير الجذور\n"
            response_text += "   • البوتاسيوم (K): مقاومة الأمراض\n\n"
            
            response_text += "2. العناصر الصغرى:\n"
            response_text += "   • الحديد، المنغنيز، الزنك، النحاس\n\n"
            
            response_text += "3. خطوات التسميد:\n"
            response_text += "   • تحليل التربة\n"
            response_text += "   • تحديد احتياجات المحصول\n"
            response_text += "   • اختيار نوع وكمية السماد\n"
            response_text += "   • تطبيق في الوقت المناسب"
        
        recommendations = [
            {
                'type': 'soil_test',
                'title': 'تحليل التربة',
                'description': 'احصل على تحليل شامل للتربة لتحديد احتياجات التسميد'
            },
            {
                'type': 'timing',
                'title': 'توقيت التسميد',
                'description': 'طبق الأسمدة في الأوقات المناسبة حسب نوع المحصول'
            }
        ]
        
        return {
            'text': response_text,
            'type': 'fertilizer_advice',
            'recommendations': recommendations,
            'confidence': 0.9,
            'follow_up_questions': [
                'هل تحتاج إلى حساب كميات السماد المطلوبة؟',
                'هل تريد معرفة أعراض نقص عناصر معينة؟'
            ]
        }
    
    def _handle_irrigation_advice(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle irrigation and water management advice"""
        
        if entities['irrigation_types']:
            # Specific irrigation type mentioned
            irrigation_type = entities['irrigation_types'][0]
            irrigation_info = self.knowledge_base['irrigation'].get(irrigation_type, {})
            
            response_text = f"نظام {irrigation_type.replace('_', ' ')}:\n\n"
            
            response_text += "المزايا:\n"
            for advantage in irrigation_info.get('advantages', []):
                response_text += f"• {advantage}\n"
            
            response_text += "\nالمحاصيل المناسبة:\n"
            for crop in irrigation_info.get('suitable_crops', []):
                response_text += f"• {crop}\n"
            
            response_text += "\nالصيانة المطلوبة:\n"
            for maintenance in irrigation_info.get('maintenance', []):
                response_text += f"• {maintenance}\n"
            
        elif entities['crops']:
            # Crop mentioned, provide irrigation recommendations
            crop = entities['crops'][0]
            crop_info = self.knowledge_base['crops'].get(crop, {})
            
            response_text = f"احتياجات الري لمحصول {crop_info.get('name_ar', crop)}:\n\n"
            response_text += f"احتياج المياه: {crop_info.get('water_needs', '')}\n\n"
            
            # Irrigation schedule based on crop
            if crop in ['tomato', 'citrus']:
                response_text += "جدول الري الموصى به:\n"
                response_text += "• الصيف: يومياً في الصباح الباكر\n"
                response_text += "• الربيع/الخريف: كل يومين\n"
                response_text += "• الشتاء: مرتين أسبوعياً\n"
            elif crop in ['wheat']:
                response_text += "جدول الري الموصى به:\n"
                response_text += "• مرحلة الإنبات: ري خفيف يومياً\n"
                response_text += "• مرحلة النمو: مرة كل 3-4 أيام\n"
                response_text += "• مرحلة الإزهار: ري منتظم\n"
                response_text += "• مرحلة النضج: تقليل الري\n"
            
            response_text += "\nنصائح مهمة:\n"
            response_text += "• تجنب الري في منتصف النهار\n"
            response_text += "• فحص رطوبة التربة بانتظام\n"
            response_text += "• ضبط كمية المياه حسب الطقس"
            
        else:
            # General irrigation inquiry
            response_text = "أساسيات إدارة المياه في الزراعة:\n\n"
            response_text += "1. أنواع أنظمة الري:\n"
            response_text += "   • الري بالتنقيط: للخضروات والأشجار\n"
            response_text += "   • الري بالرش: للحبوب والمراعي\n"
            response_text += "   • الري السطحي: للمحاصيل الحقلية\n\n"
            
            response_text += "2. عوامل تحديد احتياجات الري:\n"
            response_text += "   • نوع المحصول\n"
            response_text += "   • مرحلة النمو\n"
            response_text += "   • نوع التربة\n"
            response_text += "   • الظروف الجوية\n\n"
            
            response_text += "3. علامات الحاجة للري:\n"
            response_text += "   • جفاف التربة على عمق 5-10 سم\n"
            response_text += "   • ذبول النباتات في الصباح\n"
            response_text += "   • تغير لون الأوراق"
        
        recommendations = [
            {
                'type': 'efficiency',
                'title': 'كفاءة الري',
                'description': 'استخدم أنظمة الري الحديثة لتوفير المياه'
            },
            {
                'type': 'scheduling',
                'title': 'جدولة الري',
                'description': 'ضع جدول ري مناسب لنوع المحصول والظروف المحلية'
            }
        ]
        
        return {
            'text': response_text,
            'type': 'irrigation_advice',
            'recommendations': recommendations,
            'confidence': 0.85,
            'follow_up_questions': [
                'هل تحتاج إلى حساب كمية المياه المطلوبة؟',
                'هل تريد نصائح لتوفير المياه؟'
            ]
        }
    
    def _handle_planting_advice(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle planting and cultivation advice"""
        
        if entities['crops']:
            crop = entities['crops'][0]
            crop_info = self.knowledge_base['crops'].get(crop, {})
            
            response_text = f"دليل زراعة {crop_info.get('name_ar', crop)}:\n\n"
            response_text += f"موسم الزراعة: {crop_info.get('planting_season', '')}\n"
            response_text += f"موسم الحصاد: {crop_info.get('harvest_season', '')}\n"
            response_text += f"نوع التربة: {crop_info.get('soil_type', '')}\n"
            response_text += f"المناخ المناسب: {crop_info.get('climate', '')}\n\n"
            
            # Specific planting instructions based on crop
            if crop == 'wheat':
                response_text += "تعليمات الزراعة:\n"
                response_text += "• معدل البذار: 120-150 كغ/هكتار\n"
                response_text += "• عمق البذر: 2-3 سم\n"
                response_text += "• المسافة بين الخطوط: 15-20 سم\n"
                response_text += "• تحضير التربة: حراثة عميقة وتنعيم\n"
            elif crop == 'tomato':
                response_text += "تعليمات الزراعة:\n"
                response_text += "• زراعة الشتلات: عمر 6-8 أسابيع\n"
                response_text += "• المسافة بين النباتات: 50-60 سم\n"
                response_text += "• المسافة بين الخطوط: 80-100 سم\n"
                response_text += "• تحضير التربة: إضافة كومبوست وتحسين التصريف\n"
            elif crop == 'olive':
                response_text += "تعليمات الزراعة:\n"
                response_text += "• المسافة بين الأشجار: 5-7 متر\n"
                response_text += "• عمق الحفرة: 60-80 سم\n"
                response_text += "• عرض الحفرة: 60-80 سم\n"
                response_text += "• تحضير التربة: تحسين التصريف وإضافة مواد عضوية\n"
            
        else:
            response_text = "أساسيات الزراعة الناجحة:\n\n"
            response_text += "1. اختيار الوقت المناسب:\n"
            response_text += "   • حسب المناخ المحلي\n"
            response_text += "   • تجنب فترات الصقيع\n"
            response_text += "   • مراعاة دورة المحصول\n\n"
            
            response_text += "2. تحضير التربة:\n"
            response_text += "   • الحراثة العميقة\n"
            response_text += "   • إضافة المواد العضوية\n"
            response_text += "   • تحسين التصريف\n"
            response_text += "   • تعديل pH إذا لزم الأمر\n\n"
            
            response_text += "3. جودة البذور:\n"
            response_text += "   • استخدام بذور معتمدة\n"
            response_text += "   • فحص نسبة الإنبات\n"
            response_text += "   • معاملة البذور إذا لزم\n\n"
            
            response_text += "4. تقنيات الزراعة:\n"
            response_text += "   • العمق المناسب\n"
            response_text += "   • المسافات الصحيحة\n"
            response_text += "   • الري بعد ا��زراعة"
        
        recommendations = [
            {
                'type': 'timing',
                'title': 'التوقيت المناسب',
                'description': 'اختر أفضل وقت للزراعة حسب المحصول والمناخ'
            },
            {
                'type': 'soil_preparation',
                'title': 'تحضير التربة',
                'description': 'احرص على تحضير التربة جيداً قبل الزراعة'
            }
        ]
        
        return {
            'text': response_text,
            'type': 'planting_advice',
            'recommendations': recommendations,
            'confidence': 0.9,
            'follow_up_questions': [
                'هل تحتاج إلى معلومات عن تحضير التربة؟',
                'هل تريد نصائح عن العناية بعد الزراعة؟'
            ]
        }
    
    def _handle_harvest_advice(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle harvest and post-harvest advice"""
        
        if entities['crops']:
            crop = entities['crops'][0]
            crop_info = self.knowledge_base['crops'].get(crop, {})
            
            response_text = f"دليل حصاد {crop_info.get('name_ar', crop)}:\n\n"
            response_text += f"موسم الحصاد: {crop_info.get('harvest_season', '')}\n\n"
            
            # Specific harvest instructions
            if crop == 'tomato':
                response_text += "علامات النضج:\n"
                response_text += "• تغير اللون من الأخضر إلى الأحمر\n"
                response_text += "• ليونة طفيفة عند الضغط\n"
                response_text += "• سهولة القطف من الساق\n\n"
                
                response_text += "طريقة الحصاد:\n"
                response_text += "• القطف في الصباح الباكر\n"
                response_text += "• استخدام مقص حاد\n"
                response_text += "• ترك جزء من الساق\n"
                response_text += "• تجنب الضغط على الثمار\n"
                
            elif crop == 'wheat':
                response_text += "علامات النضج:\n"
                response_text += "• اصفرار السنابل\n"
                response_text += "• جفاف الساق\n"
                response_text += "• نسبة رطوبة 12-14%\n\n"
                
                response_text += "طريقة الحصاد:\n"
                response_text += "• الحصاد في الصباح\n"
                response_text += "• تجنب الأيام الماطرة\n"
                response_text += "• ضبط ارتفاع المحصلة\n"
                response_text += "• فصل القش عن الحبوب\n"
                
            elif crop == 'olive':
                response_text += "علامات النضج:\n"
                response_text += "• تغير لون الثمار\n"
                response_text += "• سهولة السقوط\n"
                response_text += "• نسبة الزيت المطلوبة\n\n"
                
                response_text += "طريقة الحصاد:\n"
                response_text += "• القطف اليدوي للجودة العالية\n"
                response_text += "• استخدام آلات الهز للكميات الكبيرة\n"
                response_text += "• تجنب ملامسة الأرض\n"
                response_text += "• النقل السريع للمعصرة\n"
            
            response_text += "\n\nالتعامل بعد الحصاد:\n"
            response_text += "• التنظيف والفرز\n"
            response_text += "• التخزين في ظروف مناسبة\n"
            response_text += "• التعبئة والتغليف\n"
            response_text += "• النقل والتسويق\n"
            
        else:
            response_text = "أساسيات الحصاد السليم:\n\n"
            response_text += "1. تحديد وقت النضج:\n"
            response_text += "   • مراقبة علامات النضج\n"
            response_text += "   • قياس نسبة الرطوبة\n"
            response_text += "   • فحص جودة الثمار\n\n"
            
            response_text += "2. تقنيات الحصاد:\n"
            response_text += "   • اختيار الوقت المناسب من اليوم\n"
            response_text += "   • استخدام أدوات مناسبة\n"
            response_text += "   • التعامل بعناية مع المحصول\n\n"
            
            response_text += "3. ما بعد الحصاد:\n"
            response_text += "   • التبريد السريع إذا لزم\n"
            response_text += "   • التنظيف والفرز\n"
            response_text += "   • التخزين في ظروف مناسبة\n"
            response_text += "   • التعبئة للتسويق"
        
        recommendations = [
            {
                'type': 'timing',
                'title': 'التوقيت الصحيح',
                'description': 'احصد في الوقت المناسب لضمان أفضل جودة'
            },
            {
                'type': 'post_harvest',
                'title': 'ما بعد الحصاد',
                'description': 'اتبع الممارسات الصحيحة للحفاظ على جودة المحصول'
            }
        ]
        
        return {
            'text': response_text,
            'type': 'harvest_advice',
            'recommendations': recommendations,
            'confidence': 0.9,
            'follow_up_questions': [
                'هل تحتاج إلى نصائح للتخزين؟',
                'هل تريد معلومات عن التسويق؟'
            ]
        }
    
    def _handle_pest_control(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle pest control advice"""
        
        response_text = "إدارة الآفات المتكاملة:\n\n"
        
        response_text += "1. الوقاية:\n"
        response_text += "   • زراعة أصناف مقاومة\n"
        response_text += "   • الدورة ال��راعية\n"
        response_text += "   • النظافة العامة للمزرعة\n"
        response_text += "   • المراقبة المستمرة\n\n"
        
        response_text += "2. المكافحة الحيوية:\n"
        response_text += "   • استخدام الأعداء الطبيعية\n"
        response_text += "   • المصائد الفرمونية\n"
        response_text += "   • النباتات الطاردة\n\n"
        
        response_text += "3. المكافحة الكيميائية:\n"
        response_text += "   • استخدام مبيدات آمنة\n"
        response_text += "   • اتباع توصيات الجرعة\n"
        response_text += "   • مراعاة فترة الأمان\n"
        response_text += "   • التناوب بين المبيدات\n\n"
        
        if entities['crops']:
            crop = entities['crops'][0]
            crop_info = self.knowledge_base['crops'].get(crop, {})
            
            response_text += f"آفات شائعة في {crop_info.get('name_ar', crop)}:\n"
            
            # Add crop-specific pest information
            if crop == 'tomato':
                response_text += "• دودة ثمار الطماطم\n"
                response_text += "• المن\n"
                response_text += "• التربس\n"
                response_text += "• العنكبوت الأحمر\n"
            elif crop == 'wheat':
                response_text += "• دودة ورق القطن\n"
                response_text += "• المن\n"
                response_text += "• دودة الحشد الخريفية\n"
                response_text += "• الخنافس\n"
            elif crop == 'olive':
                response_text += "• ذبابة الزيتون\n"
                response_text += "• دودة أوراق الزيتون\n"
                response_text += "• القرمز\n"
                response_text += "• العث الأحمر\n"
        
        recommendations = [
            {
                'type': 'monitoring',
                'title': 'المراقبة المستمرة',
                'description': 'راقب المزرعة بانتظام للكشف المبكر عن الآفات'
            },
            {
                'type': 'integrated_approach',
                'title': 'النهج المتكامل',
                'description': 'استخدم مزيج من طرق المكافحة المختلفة'
            }
        ]
        
        return {
            'text': response_text,
            'type': 'pest_control',
            'recommendations': recommendations,
            'confidence': 0.8,
            'follow_up_questions': [
                'هل تواجه آفة معينة؟',
                'هل تريد معلومات عن المبيدات الحيوية؟'
            ]
        }
    
    def _handle_general_inquiry(self, entities: Dict, message: str) -> Dict[str, Any]:
        """Handle general agricultural inquiries"""
        
        response_text = "أهلاً وسهلاً! أنا مساعدك الذكي في الزراعة. 🌱\n\n"
        response_text += "يمكنني مساعدتك في:\n\n"
        response_text += "🔍 تشخيص أمراض النباتات\n"
        response_text += "🌿 نصائح التسميد والتغذية\n"
        response_text += "💧 إدارة الري والمياه\n"
        response_text += "🌱 توجيهات الزراعة والغرس\n"
        response_text += "🚜 إرشادات الحصاد والتخزين\n"
        response_text += "🐛 مكافحة الآفات والأمراض\n"
        response_text += "📊 تحليل السوق والأسعار\n"
        response_text += "🌤️ النصائح الجوية الزراعية\n\n"
        
        response_text += "ما هو السؤال الذي تود طرحه؟"
        
        recommendations = [
            {
                'type': 'service',
                'title': 'خدمات متقدمة',
                'description': 'جرب خدمات الذكاء الاصطناعي للتشخيص والتحليل'
            },
            {
                'type': 'knowledge',
                'title': 'قاعدة المعرفة',
                'description': 'استفد من معرفتي الواسعة في الزراعة'
            }
        ]
        
        return {
            'text': response_text,
            'type': 'general_inquiry',
            'recommendations': recommendations,
            'confidence': 0.7,
            'follow_up_questions': [
                'هل لديك محصول معين تريد السؤال عنه؟',
                'هل تواجه مشكلة معينة في مزرعتك؟',
                'هل تريد نصائح عامة للزراعة؟'
            ]
        }
    
    def get_conversation_history(self, conversation_id: str = None, limit: int = 10) -> List[Dict]:
        """Get conversation history"""
        if conversation_id:
            history = [h for h in self.conversation_history if h.get('conversation_id') == conversation_id]
        else:
            history = self.conversation_history
        
        return history[-limit:] if limit else history
    
    def clear_conversation(self, conversation_id: str = None):
        """Clear conversation history"""
        if conversation_id:
            self.conversation_history = [
                h for h in self.conversation_history 
                if h.get('conversation_id') != conversation_id
            ]
        else:
            self.conversation_history = []
    
    def get_supported_topics(self) -> Dict[str, List[str]]:
        """Get list of supported topics and capabilities"""
        return {
            'intents': list(self.intent_patterns.keys()),
            'crops': list(self.knowledge_base['crops'].keys()),
            'diseases': list(self.knowledge_base['diseases'].keys()),
            'fertilizers': list(self.knowledge_base['fertilizers'].keys()),
            'irrigation_types': list(self.knowledge_base['irrigation'].keys()),
            'capabilities': [
                'disease_diagnosis',
                'fertilizer_advice', 
                'irrigation_management',
                'planting_guidance',
                'harvest_advice',
                'pest_control',
                'general_consultation'
            ]
        }
