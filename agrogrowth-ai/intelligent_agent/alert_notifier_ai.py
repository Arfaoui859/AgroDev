import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertCategory(Enum):
    WEATHER = "weather"
    DISEASE = "disease"
    PEST = "pest"
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    HARVEST = "harvest"
    MARKET = "market"
    EQUIPMENT = "equipment"
    TASK_REMINDER = "task_reminder"

@dataclass
class Alert:
    """Represents an agricultural alert"""
    id: str
    title: str
    title_ar: str
    message: str
    message_ar: str
    category: AlertCategory
    severity: AlertSeverity
    crop_type: Optional[str]
    field_id: Optional[str]
    farmer_id: str
    created_at: datetime
    trigger_conditions: Dict[str, Any]
    recommended_actions: List[str]
    estimated_impact: Dict[str, Any]
    expires_at: Optional[datetime]
    is_acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    auto_generated: bool = True
    related_data: Dict[str, Any] = None

class AlertNotifierAI:
    """
    Intelligent Alert and Notification System for Agriculture
    
    Features:
    - Predictive alert generation
    - Multi-channel notifications
    - Priority-based alert management
    - Context-aware messaging
    - Automated alert escalation
    - Historical alert analysis
    - Custom alert rules
    - Integration with all AI services
    """
    
    def __init__(self):
        self.active_alerts = []
        self.alert_history = []
        self.alert_rules = self._initialize_alert_rules()
        self.notification_channels = {}
        self.farmer_preferences = {}
        
        # Alert scoring weights
        self.severity_weights = {
            'weather_impact': 0.25,
            'crop_health_risk': 0.30,
            'economic_impact': 0.20,
            'time_sensitivity': 0.15,
            'prevention_opportunity': 0.10
        }
        
        # Tunisia-specific agricultural calendar and thresholds
        self.agricultural_calendar = {
            'wheat': {
                'critical_periods': {
                    'planting': [(11, 15), (12, 15)],  # Nov 15 - Dec 15
                    'fertilization': [(12, 1), (3, 15)],  # Dec 1 - Mar 15
                    'disease_watch': [(2, 1), (4, 30)],   # Feb 1 - Apr 30
                    'harvest': [(5, 15), (6, 30)]         # May 15 - Jun 30
                }
            },
            'olive': {
                'critical_periods': {
                    'irrigation': [(5, 1), (9, 30)],      # May 1 - Sep 30
                    'pest_monitoring': [(4, 1), (8, 31)], # Apr 1 - Aug 31
                    'harvest': [(10, 1), (12, 31)]        # Oct 1 - Dec 31
                }
            },
            'tomato': {
                'critical_periods': {
                    'disease_watch': [(1, 1), (12, 31)],  # Year-round
                    'irrigation': [(1, 1), (12, 31)],     # Daily monitoring
                    'harvest': [(12, 1), (6, 30)]         # Dec 1 - Jun 30
                }
            }
        }
    
    def _initialize_alert_rules(self) -> Dict[str, Dict]:
        """Initialize comprehensive alert rules for different scenarios"""
        return {
            'weather_alerts': {
                'frost_warning': {
                    'conditions': {'temperature': '<2°C', 'forecast_hours': 12},
                    'severity': AlertSeverity.HIGH,
                    'message_template': 'تحذير من الصقيع: درجة الحرارة ستنخفض إلى {temperature}°C خلال {hours} ساعة',
                    'actions': ['تغطية النباتات الحساسة', 'تشغيل أنظمة الحماية من الصقيع', 'تأجيل الري'],
                    'affected_crops': ['tomato', 'citrus', 'olive_young']
                },
                'heatwave_warning': {
                    'conditions': {'temperature': '>40°C', 'duration_days': '>3'},
                    'severity': AlertSeverity.HIGH,
                    'message_template': 'تحذير من موجة حر: درجات حرارة عالية {temperature}°C لمدة {days} أيام',
                    'actions': ['زيادة تكرار الري', 'توفير الظل للنباتات', 'تجنب العمل في منتصف النهار'],
                    'affected_crops': ['all']
                },
                'drought_alert': {
                    'conditions': {'rainfall_30days': '<10mm', 'soil_moisture': '<30%'},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'تحذير من الجفاف: قلة الأمطار وانخفاض رطوبة التربة إلى {moisture}%',
                    'actions': ['تحسين كفاءة الري', 'استخدام المالش', 'مراقبة علامات الذبول'],
                    'affected_crops': ['wheat', 'citrus', 'olive']
                },
                'heavy_rain_warning': {
                    'conditions': {'rainfall_24h': '>50mm'},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'تحذير من أمطار غزيرة: متوقع هطول {rainfall}مم خلال 24 ساعة',
                    'actions': ['تحسين التصريف', 'تأجيل الرش', 'حماية المحاصيل الناضجة'],
                    'affected_crops': ['tomato', 'wheat_harvest']
                }
            },
            
            'disease_alerts': {
                'late_blight_risk': {
                    'conditions': {'humidity': '>80%', 'temperature': '15-25°C', 'leaf_wetness': '>6h'},
                    'severity': AlertSeverity.HIGH,
                    'message_template': 'خطر عالي للإصابة باللفحة المتأخرة: رطوبة {humidity}% ودرجة حرارة {temp}°C',
                    'actions': ['الرش الوقائي بمبيد فطري', 'تحسين التهوية', 'تقليل الري الورقي'],
                    'affected_crops': ['tomato', 'potato']
                },
                'olive_fly_season': {
                    'conditions': {'month': [7, 8, 9], 'temperature': '>25°C'},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'موسم ذبابة الزيتون: احذر من الإصابة في هذا الوقت من السنة',
                    'actions': ['تركيب المصائد الفرمونية', 'مراقبة الثمار', 'الرش الوقائي عند الحاجة'],
                    'affected_crops': ['olive']
                },
                'wheat_rust_conditions': {
                    'conditions': {'humidity': '>70%', 'temperature': '15-22°C', 'leaf_wetness': '>4h'},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'ظروف مناسبة لصدأ القمح: رطوبة عالية ودرجة حرارة معتدلة',
                    'actions': ['فحص الأوراق بانتظام', 'الرش الوقائي', 'زراعة أصناف مقاومة'],
                    'affected_crops': ['wheat']
                }
            },
            
            'irrigation_alerts': {
                'soil_moisture_low': {
                    'conditions': {'soil_moisture': '<40%', 'crop_stage': 'critical'},
                    'severity': AlertSeverity.HIGH,
                    'message_template': 'انخفاض رطوبة التربة: {moisture}% في مرحلة حرجة من نمو المحصول',
                    'actions': ['ري فوري', 'فحص نظام الري', 'زيادة تكرار المراقبة'],
                    'affected_crops': ['all']
                },
                'irrigation_system_failure': {
                    'conditions': {'system_pressure': '<2bar', 'flow_rate': '<expected'},
                    'severity': AlertSeverity.CRITICAL,
                    'message_template': 'عطل في نظام الري: انخفاض الضغط إلى {pressure} بار',
                    'actions': ['فحص المضخات', 'البحث عن التسريبات', 'تشغيل النظام البديل'],
                    'affected_crops': ['all']
                },
                'water_quality_issue': {
                    'conditions': {'ec': '>3.0', 'ph': ['<6.0', '>8.5']},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'مشكلة في جودة المياه: ملوحة {ec} أو pH {ph}',
                    'actions': ['تحليل المياه', 'تحسين جودة المياه', 'تعديل برنامج التسميد'],
                    'affected_crops': ['all']
                }
            },
            
            'market_alerts': {
                'price_drop_significant': {
                    'conditions': {'price_change_7d': '<-15%'},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'انخفاض كبير في الأسعار: {crop} انخفض بنسبة {percent}% خلال أسبوع',
                    'actions': ['تأجيل البيع إن أمكن', 'البحث عن أسواق بديلة', 'تخزين المحصول'],
                    'affected_crops': ['market_dependent']
                },
                'optimal_selling_time': {
                    'conditions': {'price_trend': 'peak', 'market_demand': 'high'},
                    'severity': AlertSeverity.LOW,
                    'message_template': 'وقت مثالي للبيع: أسعار {crop} في ذروة مع طلب عالي',
                    'actions': ['بيع المحصول', 'التفاوض على أفضل الأسعار', 'تسريع الحصاد'],
                    'affected_crops': ['market_dependent']
                }
            },
            
            'task_reminders': {
                'fertilization_due': {
                    'conditions': {'days_since_last': '>30', 'crop_stage': 'growth'},
                    'severity': AlertSeverity.MEDIUM,
                    'message_template': 'موعد التسميد: مضى {days} يوم على آخر تسميد في مرحلة النمو',
                    'actions': ['تحضير الأسمدة المطلوبة', 'فحص حالة النباتات', 'تطبيق التسميد'],
                    'affected_crops': ['all']
                },
                'harvest_readiness': {
                    'conditions': {'days_to_harvest': '<=7', 'maturity_indicators': 'ready'},
                    'severity': AlertSeverity.HIGH,
                    'message_template': 'اقتراب موعد الحصاد: {crop} سيكون جاهز خلال {days} أيام',
                    'actions': ['تحضير معدات الحصاد', 'ترتيب العمالة', 'تجهيز التخزين'],
                    'affected_crops': ['all']
                }
            }
        }
    
    def generate_alerts(self, 
                       farm_data: Dict[str, Any],
                       farmer_id: str) -> Dict[str, Any]:
        """
        Generate intelligent alerts based on farm conditions and AI analysis
        
        Args:
            farm_data: Current farm conditions and sensor data
            farmer_id: Farmer identifier
            
        Returns:
            Generated alerts with priorities and recommendations
        """
        try:
            generated_alerts = []
            current_time = datetime.now()
            
            # Weather-based alerts
            weather_alerts = self._generate_weather_alerts(farm_data.get('weather', {}), farmer_id)
            generated_alerts.extend(weather_alerts)
            
            # Disease risk alerts
            disease_alerts = self._generate_disease_alerts(farm_data.get('crop_conditions', {}), farmer_id)
            generated_alerts.extend(disease_alerts)
            
            # Irrigation alerts
            irrigation_alerts = self._generate_irrigation_alerts(farm_data.get('irrigation', {}), farmer_id)
            generated_alerts.extend(irrigation_alerts)
            
            # Market alerts
            market_alerts = self._generate_market_alerts(farm_data.get('market_data', {}), farmer_id)
            generated_alerts.extend(market_alerts)
            
            # Task reminder alerts
            task_alerts = self._generate_task_alerts(farm_data.get('scheduled_tasks', []), farmer_id)
            generated_alerts.extend(task_alerts)
            
            # Priority sorting and filtering
            prioritized_alerts = self._prioritize_alerts(generated_alerts, farm_data)
            
            # Store alerts
            for alert in prioritized_alerts:
                self.active_alerts.append(alert)
            
            # Generate summary
            alert_summary = self._generate_alert_summary(prioritized_alerts)
            
            return {
                'success': True,
                'farmer_id': farmer_id,
                'generated_at': current_time.isoformat(),
                'total_alerts': len(prioritized_alerts),
                'alerts_by_severity': {
                    'critical': len([a for a in prioritized_alerts if a.severity == AlertSeverity.CRITICAL]),
                    'high': len([a for a in prioritized_alerts if a.severity == AlertSeverity.HIGH]),
                    'medium': len([a for a in prioritized_alerts if a.severity == AlertSeverity.MEDIUM]),
                    'low': len([a for a in prioritized_alerts if a.severity == AlertSeverity.LOW])
                },
                'alerts': [self._alert_to_dict(alert) for alert in prioritized_alerts],
                'summary': alert_summary,
                'next_check_recommended': (current_time + timedelta(hours=6)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating alerts: {str(e)}")
            return {
                'success': False,
                'error': f"Alert generation failed: {str(e)}",
                'farmer_id': farmer_id
            }
    
    def _generate_weather_alerts(self, weather_data: Dict, farmer_id: str) -> List[Alert]:
        """Generate weather-based alerts"""
        alerts = []
        current_time = datetime.now()
        
        # Frost warning
        if weather_data.get('min_temperature_forecast', 10) < 2:
            alert = Alert(
                id=f"frost_{farmer_id}_{int(current_time.timestamp())}",
                title="Frost Warning",
                title_ar="تحذير من الصقيع",
                message=f"Frost warning: Temperature will drop to {weather_data.get('min_temperature_forecast')}°C",
                message_ar=f"تحذير من الصقيع: درجة الحرارة ستنخفض إلى {weather_data.get('min_temperature_forecast')}°C",
                category=AlertCategory.WEATHER,
                severity=AlertSeverity.HIGH,
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={'temperature': weather_data.get('min_temperature_forecast')},
                recommended_actions=[
                    'تغطية النباتات الحساسة',
                    'تشغيل أنظمة الحماية من الصقيع',
                    'تأجيل الري حتى ارتفاع درجة الحرارة'
                ],
                estimated_impact={'crop_damage_risk': 'high', 'economic_impact': 'significant'},
                expires_at=current_time + timedelta(hours=24)
            )
            alerts.append(alert)
        
        # Heat wave warning
        if weather_data.get('max_temperature_forecast', 25) > 40:
            alert = Alert(
                id=f"heatwave_{farmer_id}_{int(current_time.timestamp())}",
                title="Heat Wave Warning",
                title_ar="تحذير من موجة حر",
                message=f"Heat wave warning: Temperature will reach {weather_data.get('max_temperature_forecast')}°C",
                message_ar=f"تحذير من موجة حر: درجة الحرارة ستصل إلى {weather_data.get('max_temperature_forecast')}°C",
                category=AlertCategory.WEATHER,
                severity=AlertSeverity.HIGH,
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={'temperature': weather_data.get('max_temperature_forecast')},
                recommended_actions=[
                    'زيادة تكرار الري',
                    'توفير الظل للنباتات الحساسة',
                    'تجنب العمل في الحقل وقت الذروة'
                ],
                estimated_impact={'stress_level': 'high', 'water_demand': 'increased'},
                expires_at=current_time + timedelta(hours=48)
            )
            alerts.append(alert)
        
        # Heavy rain warning
        if weather_data.get('rainfall_forecast_24h', 0) > 50:
            alert = Alert(
                id=f"heavy_rain_{farmer_id}_{int(current_time.timestamp())}",
                title="Heavy Rain Warning",
                title_ar="تحذير من أمطار غزيرة",
                message=f"Heavy rain expected: {weather_data.get('rainfall_forecast_24h')}mm in 24 hours",
                message_ar=f"أمطار غزيرة متوقعة: {weather_data.get('rainfall_forecast_24h')}مم خلال 24 ساعة",
                category=AlertCategory.WEATHER,
                severity=AlertSeverity.MEDIUM,
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={'rainfall': weather_data.get('rainfall_forecast_24h')},
                recommended_actions=[
                    'فحص أنظمة التصريف',
                    'تأجيل عمليات الرش',
                    'حماية المحاصيل الناضجة'
                ],
                estimated_impact={'drainage_stress': 'high', 'disease_risk': 'increased'},
                expires_at=current_time + timedelta(hours=36)
            )
            alerts.append(alert)
        
        return alerts
    
    def _generate_disease_alerts(self, crop_conditions: Dict, farmer_id: str) -> List[Alert]:
        """Generate disease risk alerts based on environmental conditions"""
        alerts = []
        current_time = datetime.now()
        
        # Late blight risk for tomatoes
        if (crop_conditions.get('humidity', 0) > 80 and 
            15 <= crop_conditions.get('temperature', 0) <= 25 and
            crop_conditions.get('leaf_wetness_hours', 0) > 6):
            
            alert = Alert(
                id=f"late_blight_{farmer_id}_{int(current_time.timestamp())}",
                title="Late Blight Risk",
                title_ar="خطر اللفحة المتأخرة",
                message="High risk conditions for late blight detected",
                message_ar="ظروف عالية الخطورة للإصابة باللفحة المتأخرة",
                category=AlertCategory.DISEASE,
                severity=AlertSeverity.HIGH,
                crop_type="tomato",
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={
                    'humidity': crop_conditions.get('humidity'),
                    'temperature': crop_conditions.get('temperature'),
                    'leaf_wetness': crop_conditions.get('leaf_wetness_hours')
                },
                recommended_actions=[
                    'الرش الوقائي بمبيد فطري مناسب',
                    'تحسين التهوية بين النباتات',
                    'تقليل الري الورقي',
                    'إزالة الأوراق السفلية المتضررة'
                ],
                estimated_impact={'crop_loss_risk': 'high', 'yield_impact': '20-40%'},
                expires_at=current_time + timedelta(days=3)
            )
            alerts.append(alert)
        
        # Olive fly season alert
        if (current_time.month in [7, 8, 9] and 
            crop_conditions.get('temperature', 0) > 25):
            
            alert = Alert(
                id=f"olive_fly_{farmer_id}_{int(current_time.timestamp())}",
                title="Olive Fly Season",
                title_ar="موسم ذبابة الزيتون",
                message="Olive fly activity season - monitor fruit carefully",
                message_ar="موسم نشاط ذبابة الزيتون - راقب الثمار بعناية",
                category=AlertCategory.PEST,
                severity=AlertSeverity.MEDIUM,
                crop_type="olive",
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={'month': current_time.month, 'temperature': crop_conditions.get('temperature')},
                recommended_actions=[
                    'تركيب المصائد الفرمونية',
                    'فحص الثمار أسبوعياً',
                    'الرش الوقائي عند اكتشاف الإصابة',
                    'جمع الثمار المتساقطة'
                ],
                estimated_impact={'fruit_damage_risk': 'medium', 'oil_quality_impact': 'potential'},
                expires_at=current_time + timedelta(days=30)
            )
            alerts.append(alert)
        
        return alerts
    
    def _generate_irrigation_alerts(self, irrigation_data: Dict, farmer_id: str) -> List[Alert]:
        """Generate irrigation-related alerts"""
        alerts = []
        current_time = datetime.now()
        
        # Low soil moisture alert
        if irrigation_data.get('soil_moisture_percentage', 100) < 40:
            alert = Alert(
                id=f"low_moisture_{farmer_id}_{int(current_time.timestamp())}",
                title="Low Soil Moisture",
                title_ar="انخفاض رطوبة التربة",
                message=f"Soil moisture is critically low: {irrigation_data.get('soil_moisture_percentage')}%",
                message_ar=f"رطوبة التربة منخفضة بشكل حرج: {irrigation_data.get('soil_moisture_percentage')}%",
                category=AlertCategory.IRRIGATION,
                severity=AlertSeverity.HIGH,
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={'soil_moisture': irrigation_data.get('soil_moisture_percentage')},
                recommended_actions=[
                    'ري فوري للمحاصيل',
                    'فحص نظام الري',
                    'زيادة تكرار المراقبة',
                    'تطبيق الملش لتقليل التبخر'
                ],
                estimated_impact={'crop_stress': 'high', 'yield_impact': 'potential'},
                expires_at=current_time + timedelta(hours=6)
            )
            alerts.append(alert)
        
        # Irrigation system pressure alert
        if irrigation_data.get('system_pressure_bar', 3) < 2:
            alert = Alert(
                id=f"pressure_low_{farmer_id}_{int(current_time.timestamp())}",
                title="Low Irrigation Pressure",
                title_ar="انخفاض ضغط نظام الري",
                message=f"Irrigation system pressure is low: {irrigation_data.get('system_pressure_bar')} bar",
                message_ar=f"ضغط نظام الري منخفض: {irrigation_data.get('system_pressure_bar')} بار",
                category=AlertCategory.IRRIGATION,
                severity=AlertSeverity.CRITICAL,
                farmer_id=farmer_id,
                created_at=current_time,
                trigger_conditions={'pressure': irrigation_data.get('system_pressure_bar')},
                recommended_actions=[
                    'فحص المضخة فوراً',
                    'البحث عن تسريبات في النظام',
                    'تشغيل النظام البديل',
                    'اتصال بفني ��لصيانة'
                ],
                estimated_impact={'irrigation_failure': 'imminent', 'crop_risk': 'critical'},
                expires_at=current_time + timedelta(hours=2)
            )
            alerts.append(alert)
        
        return alerts
    
    def _generate_market_alerts(self, market_data: Dict, farmer_id: str) -> List[Alert]:
        """Generate market-related alerts"""
        alerts = []
        current_time = datetime.now()
        
        # Significant price drop
        for crop, price_info in market_data.items():
            if isinstance(price_info, dict) and price_info.get('price_change_7d_percent', 0) < -15:
                alert = Alert(
                    id=f"price_drop_{crop}_{farmer_id}_{int(current_time.timestamp())}",
                    title=f"{crop} Price Drop",
                    title_ar=f"انخفاض سعر {crop}",
                    message=f"{crop} price dropped {abs(price_info.get('price_change_7d_percent'))}% this week",
                    message_ar=f"انخفض سعر {crop} بنسبة {abs(price_info.get('price_change_7d_percent'))}% هذا الأسبوع",
                    category=AlertCategory.MARKET,
                    severity=AlertSeverity.MEDIUM,
                    crop_type=crop,
                    farmer_id=farmer_id,
                    created_at=current_time,
                    trigger_conditions={'price_change': price_info.get('price_change_7d_percent')},
                    recommended_actions=[
                        'تأجيل البيع إن أمكن',
                        'البحث عن أسواق بديلة',
                        'تحسين جودة المحصول',
                        'التفكير في التخزين'
                    ],
                    estimated_impact={'revenue_impact': 'negative', 'selling_strategy': 'reconsider'},
                    expires_at=current_time + timedelta(days=7)
                )
                alerts.append(alert)
        
        return alerts
    
    def _generate_task_alerts(self, scheduled_tasks: List[Dict], farmer_id: str) -> List[Alert]:
        """Generate task reminder alerts"""
        alerts = []
        current_time = datetime.now()
        
        for task in scheduled_tasks:
            task_date = datetime.fromisoformat(task.get('scheduled_date', current_time.isoformat()))
            days_until = (task_date - current_time).days
            
            # Alert for tasks due within 24 hours
            if 0 <= days_until <= 1:
                alert = Alert(
                    id=f"task_reminder_{task.get('id', 'unknown')}_{farmer_id}",
                    title=f"Task Reminder: {task.get('name', 'Unknown Task')}",
                    title_ar=f"تذكير بالمهمة: {task.get('name_ar', 'مهمة غير محددة')}",
                    message=f"Task '{task.get('name')}' is due in {days_until} day(s)",
                    message_ar=f"المهمة '{task.get('name_ar')}' مستحقة خلال {days_until} يوم",
                    category=AlertCategory.TASK_REMINDER,
                    severity=AlertSeverity.MEDIUM,
                    crop_type=task.get('crop_type'),
                    field_id=task.get('field_id'),
                    farmer_id=farmer_id,
                    created_at=current_time,
                    trigger_conditions={'days_until': days_until},
                    recommended_actions=task.get('instructions', ['تنفيذ المهمة حسب الجدولة']),
                    estimated_impact={'task_completion': 'required'},
                    expires_at=task_date + timedelta(hours=6)
                )
                alerts.append(alert)
        
        return alerts
    
    def _prioritize_alerts(self, alerts: List[Alert], farm_data: Dict) -> List[Alert]:
        """Prioritize alerts based on severity, timing, and farm conditions"""
        
        def calculate_priority_score(alert: Alert) -> float:
            score = 0
            
            # Severity scoring
            severity_scores = {
                AlertSeverity.CRITICAL: 100,
                AlertSeverity.HIGH: 75,
                AlertSeverity.MEDIUM: 50,
                AlertSeverity.LOW: 25
            }
            score += severity_scores.get(alert.severity, 25)
            
            # Time sensitivity scoring
            if alert.expires_at:
                hours_until_expiry = (alert.expires_at - alert.created_at).total_seconds() / 3600
                if hours_until_expiry <= 6:
                    score += 30
                elif hours_until_expiry <= 24:
                    score += 20
                elif hours_until_expiry <= 72:
                    score += 10
            
            # Category-specific scoring
            if alert.category == AlertCategory.WEATHER:
                score += 20  # Weather alerts are time-sensitive
            elif alert.category == AlertCategory.IRRIGATION:
                score += 15  # Irrigation is critical
            elif alert.category == AlertCategory.DISEASE:
                score += 15  # Disease prevention is important
            
            # Economic impact scoring
            if alert.estimated_impact.get('economic_impact') == 'significant':
                score += 15
            elif alert.estimated_impact.get('crop_loss_risk') == 'high':
                score += 20
            
            return score
        
        # Calculate scores and sort
        scored_alerts = [(alert, calculate_priority_score(alert)) for alert in alerts]
        scored_alerts.sort(key=lambda x: x[1], reverse=True)
        
        return [alert for alert, score in scored_alerts]
    
    def _generate_alert_summary(self, alerts: List[Alert]) -> Dict[str, Any]:
        """Generate summary of alerts for dashboard display"""
        if not alerts:
            return {
                'status': 'all_clear',
                'message': 'لا توجد تحذيرات نشطة',
                'message_ar': 'لا توجد تحذيرات نشطة',
                'recommendations': ['متابعة العمليات الزراعية العادية']
            }
        
        critical_alerts = [a for a in alerts if a.severity == AlertSeverity.CRITICAL]
        high_alerts = [a for a in alerts if a.severity == AlertSeverity.HIGH]
        
        if critical_alerts:
            status = 'critical_attention_required'
            message = f"{len(critical_alerts)} تحذير حرج يتطلب تدخل فور��"
        elif high_alerts:
            status = 'high_attention_required'
            message = f"{len(high_alerts)} تحذير عالي الأولوية"
        else:
            status = 'moderate_attention'
            message = "تحذيرات عادية تحتاج متابعة"
        
        # Top recommendations
        top_recommendations = []
        for alert in alerts[:3]:  # Top 3 alerts
            top_recommendations.extend(alert.recommended_actions[:2])  # Top 2 actions per alert
        
        return {
            'status': status,
            'message': message,
            'total_alerts': len(alerts),
            'by_category': {
                category.value: len([a for a in alerts if a.category == category])
                for category in AlertCategory
            },
            'most_urgent': self._alert_to_dict(alerts[0]) if alerts else None,
            'top_recommendations': list(set(top_recommendations))[:5]  # Remove duplicates, max 5
        }
    
    def acknowledge_alert(self, alert_id: str, farmer_id: str, notes: str = None) -> Dict[str, Any]:
        """Acknowledge an alert"""
        try:
            alert = next((a for a in self.active_alerts if a.id == alert_id and a.farmer_id == farmer_id), None)
            
            if not alert:
                return {
                    'success': False,
                    'error': 'Alert not found'
                }
            
            alert.is_acknowledged = True
            alert.acknowledged_at = datetime.now()
            
            # Move to history
            self.alert_history.append(alert)
            self.active_alerts.remove(alert)
            
            return {
                'success': True,
                'alert_id': alert_id,
                'acknowledged_at': alert.acknowledged_at.isoformat(),
                'notes': notes
            }
            
        except Exception as e:
            logger.error(f"Error acknowledging alert: {str(e)}")
            return {
                'success': False,
                'error': f"Acknowledgment failed: {str(e)}"
            }
    
    def get_active_alerts(self, farmer_id: str, severity_filter: str = None) -> Dict[str, Any]:
        """Get active alerts for a farmer"""
        try:
            farmer_alerts = [a for a in self.active_alerts if a.farmer_id == farmer_id]
            
            if severity_filter:
                severity_enum = AlertSeverity(severity_filter.lower())
                farmer_alerts = [a for a in farmer_alerts if a.severity == severity_enum]
            
            # Sort by priority
            farmer_alerts = self._prioritize_alerts(farmer_alerts, {})
            
            return {
                'success': True,
                'farmer_id': farmer_id,
                'total_active_alerts': len(farmer_alerts),
                'alerts': [self._alert_to_dict(alert) for alert in farmer_alerts],
                'summary': self._generate_alert_summary(farmer_alerts)
            }
            
        except Exception as e:
            logger.error(f"Error getting active alerts: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to retrieve alerts: {str(e)}"
            }
    
    def _alert_to_dict(self, alert: Alert) -> Dict[str, Any]:
        """Convert alert object to dictionary"""
        return {
            'id': alert.id,
            'title': alert.title,
            'title_ar': alert.title_ar,
            'message': alert.message,
            'message_ar': alert.message_ar,
            'category': alert.category.value,
            'severity': alert.severity.value,
            'crop_type': alert.crop_type,
            'field_id': alert.field_id,
            'farmer_id': alert.farmer_id,
            'created_at': alert.created_at.isoformat(),
            'expires_at': alert.expires_at.isoformat() if alert.expires_at else None,
            'trigger_conditions': alert.trigger_conditions,
            'recommended_actions': alert.recommended_actions,
            'estimated_impact': alert.estimated_impact,
            'is_acknowledged': alert.is_acknowledged,
            'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            'auto_generated': alert.auto_generated
        }
    
    def get_alert_statistics(self, farmer_id: str, days_back: int = 30) -> Dict[str, Any]:
        """Get alert statistics for performance analysis"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_back)
            
            # Get relevant alerts
            recent_alerts = [
                a for a in (self.active_alerts + self.alert_history)
                if a.farmer_id == farmer_id and a.created_at >= cutoff_date
            ]
            
            if not recent_alerts:
                return {
                    'success': True,
                    'farmer_id': farmer_id,
                    'period_days': days_back,
                    'total_alerts': 0,
                    'message': 'No alerts in the specified period'
                }
            
            # Calculate statistics
            total_alerts = len(recent_alerts)
            acknowledged_alerts = len([a for a in recent_alerts if a.is_acknowledged])
            
            # By severity
            severity_stats = {}
            for severity in AlertSeverity:
                severity_stats[severity.value] = len([a for a in recent_alerts if a.severity == severity])
            
            # By category
            category_stats = {}
            for category in AlertCategory:
                category_stats[category.value] = len([a for a in recent_alerts if a.category == category])
            
            # Response time (for acknowledged alerts)
            response_times = []
            for alert in recent_alerts:
                if alert.is_acknowledged and alert.acknowledged_at:
                    response_time = (alert.acknowledged_at - alert.created_at).total_seconds() / 3600
                    response_times.append(response_time)
            
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            return {
                'success': True,
                'farmer_id': farmer_id,
                'period_days': days_back,
                'total_alerts': total_alerts,
                'acknowledged_alerts': acknowledged_alerts,
                'acknowledgment_rate': round((acknowledged_alerts / total_alerts) * 100, 1) if total_alerts > 0 else 0,
                'severity_distribution': severity_stats,
                'category_distribution': category_stats,
                'average_response_time_hours': round(avg_response_time, 1),
                'most_common_category': max(category_stats, key=category_stats.get) if category_stats else None,
                'alert_frequency_per_day': round(total_alerts / days_back, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting alert statistics: {str(e)}")
            return {
                'success': False,
                'error': f"Statistics calculation failed: {str(e)}"
            }
