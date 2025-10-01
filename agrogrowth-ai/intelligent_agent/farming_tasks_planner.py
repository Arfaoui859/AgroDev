import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class FarmingTask:
    """Represents a farming task with all its attributes"""
    id: str
    name: str
    name_ar: str
    category: str
    priority: str  # high, medium, low
    urgency: str   # immediate, within_week, within_month, seasonal
    crop_type: str
    field_id: str
    estimated_duration: int  # in minutes
    required_resources: List[str]
    prerequisites: List[str]
    weather_dependency: bool
    seasonal_window: Tuple[int, int]  # (start_month, end_month)
    optimal_conditions: Dict[str, Any]
    cost_estimate: float
    expected_outcome: str
    instructions: List[str]
    safety_requirements: List[str]
    created_at: datetime
    scheduled_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = 'pending'  # pending, scheduled, in_progress, completed, cancelled

class FarmingTasksPlanner:
    """
    Intelligent Farming Tasks Planning System
    
    Features:
    - Automated task generation based on crop cycles
    - Priority and urgency assessment
    - Resource allocation optimization
    - Weather-dependent scheduling
    - Seasonal task planning
    - Conflict detection and resolution
    - Performance tracking and optimization
    """
    
    def __init__(self):
        self.tasks = []
        self.task_templates = self._initialize_task_templates()
        self.crop_calendars = self._initialize_crop_calendars()
        self.resource_availability = {}
        
        # Priority weights for task scoring
        self.priority_weights = {
            'crop_health': 0.30,
            'seasonal_timing': 0.25,
            'resource_efficiency': 0.20,
            'economic_impact': 0.15,
            'weather_dependency': 0.10
        }
    
    def _initialize_task_templates(self) -> Dict[str, Dict]:
        """Initialize task templates for different farming activities"""
        return {
            'soil_preparation': {
                'plowing': {
                    'name': 'Plowing',
                    'name_ar': 'حراثة',
                    'category': 'soil_preparation',
                    'duration': 480,  # 8 hours
                    'resources': ['tractor', 'plow', 'fuel', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'soil_moisture': 'medium',
                        'temperature': (10, 30),
                        'rain_forecast': False
                    },
                    'cost_per_hectare': 150,
                    'instructions': [
                        'فحص حالة التربة والرطوبة',
                        'ضبط عمق الحراثة حسب نوع المحصول',
                        'تجنب الحراثة في التربة المشبعة بالماء',
                        'فحص معدات الحراثة قبل البدء'
                    ]
                },
                'disking': {
                    'name': 'Disking',
                    'name_ar': 'تنعيم',
                    'category': 'soil_preparation',
                    'duration': 360,  # 6 hours
                    'resources': ['tractor', 'disk_harrow', 'fuel', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'soil_moisture': 'low_medium',
                        'wind_speed': '<15km/h'
                    },
                    'cost_per_hectare': 100,
                    'instructions': [
                        'تنعيم التربة بعد الحراثة',
                        'ضبط عمق التنعيم 5-10 سم',
                        'التأكد من تفتيت الكتل الترابية',
                        'إزالة الحشائش والبقايا النباتية'
                    ]
                }
            },
            
            'planting': {
                'seeding': {
                    'name': 'Seeding',
                    'name_ar': 'بذر',
                    'category': 'planting',
                    'duration': 420,  # 7 hours
                    'resources': ['seeder', 'seeds', 'fertilizer', 'tractor', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'soil_temperature': (15, 25),
                        'soil_moisture': 'medium',
                        'rain_forecast_48h': False
                    },
                    'cost_per_hectare': 200,
                    'instructions': [
                        'فحص جودة البذور ونسبة الإنبات',
                        'ضبط معدل البذار حسب نوع المحصول',
                        'ضبط عمق البذر المناسب',
                        'التأكد من توزيع السماد القاعدي'
                    ]
                },
                'transplanting': {
                    'name': 'Transplanting',
                    'name_ar': 'شتل',
                    'category': 'planting',
                    'duration': 600,  # 10 hours
                    'resources': ['seedlings', 'water', 'transplanter', 'workers'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'temperature': (18, 28),
                        'humidity': '>60%',
                        'wind_speed': '<10km/h'
                    },
                    'cost_per_hectare': 800,
                    'instructions': [
                        'إعداد الشتلات قبل 24 ساعة',
                        'ري الحقل قبل الشتل',
                        'زراعة في الصباح الباكر أو المساء',
                        'ري مباشر بعد الشتل'
                    ]
                }
            },
            
            'irrigation': {
                'irrigation_setup': {
                    'name': 'Irrigation System Setup',
                    'name_ar': 'تركيب نظام الري',
                    'category': 'irrigation',
                    'duration': 480,
                    'resources': ['irrigation_equipment', 'pipes', 'workers', 'tools'],
                    'weather_dependency': False,
                    'cost_per_hectare': 2000,
                    'instructions': [
                        'تخطيط شبكة الري حسب المحصول',
                        'تركيب المواسير الرئيسية والفرعية',
                        'تركيب نقاطات الري أو الرشاشات',
                        'اختبار النظام والتأكد من عدم وجود تسريبات'
                    ]
                },
                'routine_irrigation': {
                    'name': 'Routine Irrigation',
                    'name_ar': 'ري دوري',
                    'category': 'irrigation',
                    'duration': 120,
                    'resources': ['water', 'irrigation_system', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'temperature': '<35°C',
                        'wind_speed': '<20km/h'
                    },
                    'cost_per_hectare': 50,
                    'instructions': [
                        'فحص رطوبة التربة قبل الري',
                        'ضبط كمية المياه حسب مرحلة النمو',
                        'الري في الصباح الباكر أو المساء',
                        'مراقبة توزيع المياه بانتظام'
                    ]
                }
            },
            
            'fertilization': {
                'base_fertilization': {
                    'name': 'Base Fertilization',
                    'name_ar': 'تسميد أساسي',
                    'category': 'fertilization',
                    'duration': 240,
                    'resources': ['fertilizer', 'spreader', 'tractor', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'rain_forecast_24h': False,
                        'wind_speed': '<15km/h'
                    },
                    'cost_per_hectare': 300,
                    'instructions': [
                        'تحديد نوع وكمية السماد حسب تحليل التربة',
                        'ضبط جهاز النثر للتوزيع المنتظم',
                        'تجنب التسميد قبل المطر مباشرة',
                        'خلط السماد بالتربة بعد النثر'
                    ]
                },
                'foliar_fertilization': {
                    'name': 'Foliar Fertilization',
                    'name_ar': 'تسميد ورقي',
                    'category': 'fertilization',
                    'duration': 180,
                    'resources': ['liquid_fertilizer', 'sprayer', 'water', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'temperature': (15, 25),
                        'humidity': '>50%',
                        'wind_speed': '<10km/h'
                    },
                    'cost_per_hectare': 150,
                    'instructions': [
                        'تحضير المحلول المغذي بالتركيز المناسب',
                        'الرش في الصباح الباكر أو المساء',
                        'تجنب الرش في الأيام الحارة',
                        'ضمان تغطية متساوية للأوراق'
                    ]
                }
            },
            
            'pest_control': {
                'preventive_spraying': {
                    'name': 'Preventive Spraying',
                    'name_ar': 'رش وقائي',
                    'category': 'pest_control',
                    'duration': 240,
                    'resources': ['pesticide', 'sprayer', 'protective_equipment', 'operator'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'wind_speed': '<10km/h',
                        'temperature': (10, 30),
                        'rain_forecast_6h': False
                    },
                    'cost_per_hectare': 200,
                    'instructions': [
                        'فحص مستوى الآفات قبل الرش',
                        'اختيار المبيد المناسب والتركيز الصحيح',
                        'ارتداء معدات الحماية الشخصية',
                        'تجنب الرش أثناء الرياح القوية'
                    ]
                },
                'integrated_pest_management': {
                    'name': 'Integrated Pest Management',
                    'name_ar': 'مكافحة متكاملة',
                    'category': 'pest_control',
                    'duration': 360,
                    'resources': ['biological_agents', 'traps', 'monitoring_tools', 'specialist'],
                    'weather_dependency': False,
                    'cost_per_hectare': 400,
                    'instructions': [
                        'تركيب المصائد الفرمونية',
                        'إطلاق الأعداء الطبيعية',
                        'مراقبة مستويات الآفات أسبوعياً',
                        'تطبيق المكافحة الحيوية حسب الحاجة'
                    ]
                }
            },
            
            'harvest': {
                'mechanical_harvest': {
                    'name': 'Mechanical Harvest',
                    'name_ar': 'حصاد آلي',
                    'category': 'harvest',
                    'duration': 600,
                    'resources': ['harvester', 'trucks', 'storage_containers', 'operators'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'humidity': '<18%',
                        'rain_forecast_24h': False,
                        'wind_speed': '<20km/h'
                    },
                    'cost_per_hectare': 500,
                    'instructions': [
                        'فحص نضج المحصول',
                        'ضبط إعدادات الحصادة',
                        'تجنب الحصاد في الطقس الرطب',
                        'نقل المحصول فوراً للتخزين'
                    ]
                },
                'manual_harvest': {
                    'name': 'Manual Harvest',
                    'name_ar': 'حصاد يدوي',
                    'category': 'harvest',
                    'duration': 1200,  # 20 hours
                    'resources': ['workers', 'harvest_containers', 'tools'],
                    'weather_dependency': True,
                    'optimal_conditions': {
                        'temperature': (10, 30),
                        'rain_forecast_6h': False
                    },
                    'cost_per_hectare': 800,
                    'instructions': [
                        'تدريب العمال على طرق القطف الصحيحة',
                        'القطف في الصباح الباكر',
                        'التعامل بعناية مع المحصول',
                        'فرز وتصنيف المحصول أثناء القطف'
                    ]
                }
            }
        }
    
    def _initialize_crop_calendars(self) -> Dict[str, Dict]:
        """Initialize crop-specific farming calendars for Tunisia"""
        return {
            'wheat': {
                'season': 'winter',
                'cycle_duration': 210,  # days
                'critical_periods': {
                    'planting': (11, 12),     # November-December
                    'fertilization': [(12, 1), (3, 4)],  # Dec-Jan, Mar-Apr
                    'irrigation': (3, 5),     # March-May
                    'pest_control': (2, 4),   # February-April
                    'harvest': (5, 6)         # May-June
                },
                'tasks_schedule': [
                    {'task': 'plowing', 'days_before_planting': 30},
                    {'task': 'disking', 'days_before_planting': 15},
                    {'task': 'seeding', 'days_before_planting': 0},
                    {'task': 'base_fertilization', 'days_after_planting': 7},
                    {'task': 'routine_irrigation', 'interval_days': 10, 'start_day': 60},
                    {'task': 'foliar_fertilization', 'days_after_planting': 90},
                    {'task': 'preventive_spraying', 'days_after_planting': 45},
                    {'task': 'mechanical_harvest', 'days_after_planting': 210}
                ]
            },
            
            'tomato': {
                'season': 'fall_spring',
                'cycle_duration': 150,  # days
                'critical_periods': {
                    'planting': [(9, 10), (1, 2)],  # Sep-Oct, Jan-Feb
                    'fertilization': 'throughout',
                    'irrigation': 'daily',
                    'pest_control': 'weekly',
                    'harvest': [(12, 3), (4, 6)]    # Dec-Mar, Apr-Jun
                },
                'tasks_schedule': [
                    {'task': 'plowing', 'days_before_planting': 21},
                    {'task': 'disking', 'days_before_planting': 14},
                    {'task': 'irrigation_setup', 'days_before_planting': 7},
                    {'task': 'transplanting', 'days_before_planting': 0},
                    {'task': 'base_fertilization', 'days_after_planting': 3},
                    {'task': 'routine_irrigation', 'interval_days': 2, 'start_day': 1},
                    {'task': 'foliar_fertilization', 'interval_days': 14, 'start_day': 30},
                    {'task': 'integrated_pest_management', 'days_after_planting': 21},
                    {'task': 'preventive_spraying', 'interval_days': 10, 'start_day': 35},
                    {'task': 'manual_harvest', 'interval_days': 3, 'start_day': 80}
                ]
            },
            
            'olive': {
                'season': 'perennial',
                'cycle_duration': 365,  # year-round
                'critical_periods': {
                    'planting': [(3, 4), (10, 11)],  # Mar-Apr, Oct-Nov
                    'fertilization': [(2, 3), (9, 10)],  # Feb-Mar, Sep-Oct
                    'irrigation': (5, 9),      # May-September
                    'pruning': (12, 2),       # December-February
                    'pest_control': (4, 8),   # April-August
                    'harvest': (10, 12)       # October-December
                },
                'tasks_schedule': [
                    {'task': 'pruning', 'months': [1, 2]},
                    {'task': 'base_fertilization', 'months': [2, 9]},
                    {'task': 'irrigation_setup', 'months': [4]},
                    {'task': 'routine_irrigation', 'interval_days': 7, 'months': [5, 6, 7, 8, 9]},
                    {'task': 'preventive_spraying', 'months': [4, 6, 8]},
                    {'task': 'manual_harvest', 'months': [10, 11, 12]}
                ]
            },
            
            'citrus': {
                'season': 'perennial',
                'cycle_duration': 365,
                'critical_periods': {
                    'planting': (3, 4),       # March-April
                    'fertilization': [(2, 3), (6, 7), (9, 10)],  # Multiple times
                    'irrigation': (4, 10),    # April-October
                    'pruning': (1, 2),       # January-February
                    'pest_control': (3, 9),   # March-September
                    'harvest': (11, 2)       # November-February
                },
                'tasks_schedule': [
                    {'task': 'pruning', 'months': [1, 2]},
                    {'task': 'base_fertilization', 'months': [2, 6, 9]},
                    {'task': 'irrigation_setup', 'months': [3]},
                    {'task': 'routine_irrigation', 'interval_days': 5, 'months': [4, 5, 6, 7, 8, 9, 10]},
                    {'task': 'foliar_fertilization', 'months': [4, 7]},
                    {'task': 'integrated_pest_management', 'months': [3, 6, 9]},
                    {'task': 'manual_harvest', 'months': [11, 12, 1, 2]}
                ]
            }
        }
    
    def generate_seasonal_plan(self, 
                             crop_type: str,
                             field_id: str,
                             planting_date: datetime,
                             field_area: float,
                             available_resources: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate comprehensive seasonal farming plan
        
        Args:
            crop_type: Type of crop to plan for
            field_id: Field identifier
            planting_date: Planned planting date
            field_area: Field area in hectares
            available_resources: Available resources and constraints
            
        Returns:
            Complete seasonal plan with tasks, schedule, and recommendations
        """
        try:
            if crop_type not in self.crop_calendars:
                raise ValueError(f"Unsupported crop type: {crop_type}")
            
            crop_calendar = self.crop_calendars[crop_type]
            plan_tasks = []
            
            # Generate tasks based on crop calendar
            for task_def in crop_calendar['tasks_schedule']:
                task_template_category = self._get_task_category(task_def['task'])
                task_template = self.task_templates.get(task_template_category, {}).get(task_def['task'])
                
                if not task_template:
                    continue
                
                # Calculate task scheduling
                if 'days_before_planting' in task_def:
                    scheduled_date = planting_date - timedelta(days=task_def['days_before_planting'])
                elif 'days_after_planting' in task_def:
                    scheduled_date = planting_date + timedelta(days=task_def['days_after_planting'])
                elif 'months' in task_def:
                    # For perennial crops, schedule based on months
                    scheduled_date = self._calculate_monthly_task_date(task_def['months'], planting_date)
                else:
                    scheduled_date = planting_date
                
                # Create task
                task = self._create_task_from_template(
                    task_template, task_def, crop_type, field_id, 
                    scheduled_date, field_area
                )
                
                plan_tasks.append(task)
                
                # Handle recurring tasks
                if 'interval_days' in task_def:
                    start_day = task_def.get('start_day', 0)
                    interval = task_def['interval_days']
                    end_day = crop_calendar['cycle_duration']
                    
                    current_day = start_day
                    while current_day <= end_day:
                        recurring_date = planting_date + timedelta(days=current_day)
                        recurring_task = self._create_task_from_template(
                            task_template, task_def, crop_type, field_id,
                            recurring_date, field_area, is_recurring=True
                        )
                        plan_tasks.append(recurring_task)
                        current_day += interval
            
            # Sort tasks by scheduled date
            plan_tasks.sort(key=lambda x: x.scheduled_date or datetime.max)
            
            # Calculate plan statistics
            plan_stats = self._calculate_plan_statistics(plan_tasks, field_area)
            
            # Generate recommendations
            recommendations = self._generate_plan_recommendations(
                crop_type, plan_tasks, available_resources, plan_stats
            )
            
            return {
                'success': True,
                'crop_type': crop_type,
                'field_id': field_id,
                'planting_date': planting_date.isoformat(),
                'field_area_hectares': field_area,
                'plan_duration_days': crop_calendar['cycle_duration'],
                'total_tasks': len(plan_tasks),
                'tasks': [self._task_to_dict(task) for task in plan_tasks],
                'statistics': plan_stats,
                'recommendations': recommendations,
                'generated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating seasonal plan: {str(e)}")
            return {
                'success': False,
                'error': f"Plan generation failed: {str(e)}",
                'crop_type': crop_type
            }
    
    def optimize_task_schedule(self, 
                             tasks: List[FarmingTask],
                             constraints: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Optimize task scheduling considering constraints and dependencies
        
        Args:
            tasks: List of tasks to optimize
            constraints: Resource and time constraints
            
        Returns:
            Optimized schedule with conflict resolution
        """
        try:
            if not tasks:
                return {'success': True, 'optimized_tasks': [], 'conflicts': []}
            
            # Initialize constraints
            if constraints is None:
                constraints = {}
            
            # Detect conflicts
            conflicts = self._detect_scheduling_conflicts(tasks)
            
            # Resolve conflicts
            optimized_tasks = self._resolve_conflicts(tasks, conflicts, constraints)
            
            # Apply resource optimization
            optimized_tasks = self._optimize_resource_allocation(optimized_tasks, constraints)
            
            # Apply weather optimization
            optimized_tasks = self._optimize_weather_dependencies(optimized_tasks)
            
            # Calculate optimization metrics
            optimization_metrics = self._calculate_optimization_metrics(tasks, optimized_tasks)
            
            return {
                'success': True,
                'original_tasks_count': len(tasks),
                'optimized_tasks': [self._task_to_dict(task) for task in optimized_tasks],
                'conflicts_detected': len(conflicts),
                'conflicts_resolved': len([c for c in conflicts if c.get('resolved')]),
                'optimization_metrics': optimization_metrics,
                'optimization_notes': self._generate_optimization_notes(optimized_tasks, conflicts)
            }
            
        except Exception as e:
            logger.error(f"Error optimizing task schedule: {str(e)}")
            return {
                'success': False,
                'error': f"Schedule optimization failed: {str(e)}"
            }
    
    def get_daily_tasks(self, 
                       date: datetime,
                       field_ids: List[str] = None,
                       include_upcoming: int = 7) -> Dict[str, Any]:
        """
        Get tasks scheduled for specific date and upcoming period
        
        Args:
            date: Target date
            field_ids: Optional list of field IDs to filter
            include_upcoming: Number of days to include for upcoming tasks
            
        Returns:
            Daily task schedule with priorities and recommendations
        """
        try:
            # Filter tasks for the specified date and period
            daily_tasks = []
            upcoming_tasks = []
            
            for task in self.tasks:
                if not task.scheduled_date:
                    continue
                
                # Filter by field if specified
                if field_ids and task.field_id not in field_ids:
                    continue
                
                task_date = task.scheduled_date.date()
                target_date = date.date()
                
                if task_date == target_date:
                    daily_tasks.append(task)
                elif task_date > target_date and task_date <= (target_date + timedelta(days=include_upcoming)):
                    upcoming_tasks.append(task)
            
            # Sort by priority and urgency
            daily_tasks.sort(key=lambda x: (self._get_priority_score(x), x.scheduled_date))
            upcoming_tasks.sort(key=lambda x: (x.scheduled_date, self._get_priority_score(x)))
            
            # Group tasks by category
            tasks_by_category = {}
            for task in daily_tasks:
                if task.category not in tasks_by_category:
                    tasks_by_category[task.category] = []
                tasks_by_category[task.category].append(task)
            
            # Calculate daily workload
            total_duration = sum(task.estimated_duration for task in daily_tasks)
            total_cost = sum(task.cost_estimate for task in daily_tasks)
            
            # Weather considerations
            weather_dependent_tasks = [task for task in daily_tasks if task.weather_dependency]
            
            # Generate daily recommendations
            daily_recommendations = self._generate_daily_recommendations(
                daily_tasks, upcoming_tasks, date
            )
            
            return {
                'success': True,
                'date': date.strftime('%Y-%m-%d'),
                'daily_tasks': [self._task_to_dict(task) for task in daily_tasks],
                'upcoming_tasks': [self._task_to_dict(task) for task in upcoming_tasks[:10]],
                'tasks_by_category': {
                    category: [self._task_to_dict(task) for task in tasks]
                    for category, tasks in tasks_by_category.items()
                },
                'workload_summary': {
                    'total_tasks': len(daily_tasks),
                    'total_duration_hours': round(total_duration / 60, 1),
                    'estimated_cost': round(total_cost, 2),
                    'weather_dependent_tasks': len(weather_dependent_tasks),
                    'high_priority_tasks': len([t for t in daily_tasks if t.priority == 'high'])
                },
                'recommendations': daily_recommendations
            }
            
        except Exception as e:
            logger.error(f"Error getting daily tasks: {str(e)}")
            return {
                'success': False,
                'error': f"Daily task retrieval failed: {str(e)}"
            }
    
    def add_custom_task(self, 
                       task_data: Dict[str, Any],
                       auto_schedule: bool = True) -> Dict[str, Any]:
        """
        Add custom farming task to the plan
        
        Args:
            task_data: Task data dictionary
            auto_schedule: Whether to automatically schedule the task
            
        Returns:
            Result of task addition with scheduling information
        """
        try:
            # Validate required fields
            required_fields = ['name', 'name_ar', 'category', 'crop_type', 'field_id']
            for field in required_fields:
                if field not in task_data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Create task object
            task = FarmingTask(
                id=f"custom_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                name=task_data['name'],
                name_ar=task_data['name_ar'],
                category=task_data['category'],
                priority=task_data.get('priority', 'medium'),
                urgency=task_data.get('urgency', 'within_week'),
                crop_type=task_data['crop_type'],
                field_id=task_data['field_id'],
                estimated_duration=task_data.get('estimated_duration', 240),
                required_resources=task_data.get('required_resources', []),
                prerequisites=task_data.get('prerequisites', []),
                weather_dependency=task_data.get('weather_dependency', False),
                seasonal_window=task_data.get('seasonal_window', (1, 12)),
                optimal_conditions=task_data.get('optimal_conditions', {}),
                cost_estimate=task_data.get('cost_estimate', 0),
                expected_outcome=task_data.get('expected_outcome', ''),
                instructions=task_data.get('instructions', []),
                safety_requirements=task_data.get('safety_requirements', []),
                created_at=datetime.now(),
                scheduled_date=datetime.fromisoformat(task_data['scheduled_date']) if task_data.get('scheduled_date') else None
            )
            
            # Auto-schedule if requested and no date provided
            if auto_schedule and not task.scheduled_date:
                optimal_date = self._find_optimal_schedule_date(task)
                task.scheduled_date = optimal_date
            
            # Add to tasks list
            self.tasks.append(task)
            
            # Check for conflicts
            conflicts = self._check_task_conflicts(task)
            
            return {
                'success': True,
                'task_id': task.id,
                'task': self._task_to_dict(task),
                'scheduled_date': task.scheduled_date.isoformat() if task.scheduled_date else None,
                'conflicts': conflicts,
                'message': f"Task '{task.name_ar}' added successfully"
            }
            
        except Exception as e:
            logger.error(f"Error adding custom task: {str(e)}")
            return {
                'success': False,
                'error': f"Task addition failed: {str(e)}"
            }
    
    def update_task_status(self, 
                          task_id: str,
                          new_status: str,
                          completion_notes: str = None) -> Dict[str, Any]:
        """Update task status and handle completion logic"""
        try:
            task = next((t for t in self.tasks if t.id == task_id), None)
            if not task:
                raise ValueError(f"Task not found: {task_id}")
            
            old_status = task.status
            task.status = new_status
            
            if new_status == 'completed':
                task.completed_at = datetime.now()
            
            # Log status change
            status_change = {
                'task_id': task_id,
                'old_status': old_status,
                'new_status': new_status,
                'changed_at': datetime.now().isoformat(),
                'notes': completion_notes
            }
            
            # Check for dependent tasks
            dependent_tasks = self._get_dependent_tasks(task_id)
            
            return {
                'success': True,
                'task_id': task_id,
                'status_change': status_change,
                'dependent_tasks': len(dependent_tasks),
                'message': f"Task status updated to '{new_status}'"
            }
            
        except Exception as e:
            logger.error(f"Error updating task status: {str(e)}")
            return {
                'success': False,
                'error': f"Status update failed: {str(e)}"
            }
    
    def _get_task_category(self, task_name: str) -> str:
        """Determine task category from task name"""
        category_mapping = {
            'plowing': 'soil_preparation',
            'disking': 'soil_preparation',
            'seeding': 'planting',
            'transplanting': 'planting',
            'irrigation_setup': 'irrigation',
            'routine_irrigation': 'irrigation',
            'base_fertilization': 'fertilization',
            'foliar_fertilization': 'fertilization',
            'preventive_spraying': 'pest_control',
            'integrated_pest_management': 'pest_control',
            'mechanical_harvest': 'harvest',
            'manual_harvest': 'harvest',
            'pruning': 'maintenance'
        }
        return category_mapping.get(task_name, 'general')
    
    def _calculate_monthly_task_date(self, months: List[int], reference_date: datetime) -> datetime:
        """Calculate task date based on month specification"""
        current_year = reference_date.year
        target_month = months[0]  # Use first month for scheduling
        
        # Adjust year if month has passed
        if target_month < reference_date.month:
            current_year += 1
        
        return datetime(current_year, target_month, 15)  # Use 15th of month as default
    
    def _create_task_from_template(self, 
                                  template: Dict,
                                  task_def: Dict,
                                  crop_type: str,
                                  field_id: str,
                                  scheduled_date: datetime,
                                  field_area: float,
                                  is_recurring: bool = False) -> FarmingTask:
        """Create task object from template"""
        
        task_id = f"{crop_type}_{field_id}_{template['name'].lower().replace(' ', '_')}_{scheduled_date.strftime('%Y%m%d')}"
        if is_recurring:
            task_id += f"_r{int(scheduled_date.timestamp())}"
        
        # Calculate cost based on field area
        cost = template.get('cost_per_hectare', 0) * field_area
        
        return FarmingTask(
            id=task_id,
            name=template['name'],
            name_ar=template['name_ar'],
            category=template['category'],
            priority=self._determine_task_priority(template, crop_type, scheduled_date),
            urgency=self._determine_task_urgency(template, scheduled_date),
            crop_type=crop_type,
            field_id=field_id,
            estimated_duration=template['duration'],
            required_resources=template.get('resources', []),
            prerequisites=[],
            weather_dependency=template.get('weather_dependency', False),
            seasonal_window=(1, 12),  # Default to year-round
            optimal_conditions=template.get('optimal_conditions', {}),
            cost_estimate=cost,
            expected_outcome=f"Complete {template['name_ar']} for {crop_type}",
            instructions=template.get('instructions', []),
            safety_requirements=template.get('safety_requirements', []),
            created_at=datetime.now(),
            scheduled_date=scheduled_date
        )
    
    def _determine_task_priority(self, template: Dict, crop_type: str, scheduled_date: datetime) -> str:
        """Determine task priority based on various factors"""
        # Critical tasks for crop health
        critical_tasks = ['seeding', 'transplanting', 'irrigation_setup', 'harvest']
        if template['name'].lower() in [t.lower() for t in critical_tasks]:
            return 'high'
        
        # Weather-dependent tasks have higher priority during optimal windows
        if template.get('weather_dependency') and self._is_optimal_weather_window(scheduled_date):
            return 'high'
        
        # Fertilization and pest control are medium priority
        if template['category'] in ['fertilization', 'pest_control']:
            return 'medium'
        
        return 'medium'
    
    def _determine_task_urgency(self, template: Dict, scheduled_date: datetime) -> str:
        """Determine task urgency based on timing"""
        days_until = (scheduled_date - datetime.now()).days
        
        if days_until <= 0:
            return 'immediate'
        elif days_until <= 3:
            return 'within_week'
        elif days_until <= 14:
            return 'within_month'
        else:
            return 'seasonal'
    
    def _is_optimal_weather_window(self, date: datetime) -> bool:
        """Check if date falls within optimal weather window"""
        # Tunisia weather patterns - simple heuristic
        month = date.month
        
        # Avoid extreme summer (July-August) and wet winter (December-January)
        if month in [7, 8, 12, 1]:
            return False
        
        return True
    
    def _calculate_plan_statistics(self, tasks: List[FarmingTask], field_area: float) -> Dict[str, Any]:
        """Calculate plan statistics"""
        total_tasks = len(tasks)
        total_duration = sum(task.estimated_duration for task in tasks)
        total_cost = sum(task.cost_estimate for task in tasks)
        
        # Tasks by category
        category_counts = {}
        for task in tasks:
            category_counts[task.category] = category_counts.get(task.category, 0) + 1
        
        # Priority distribution
        priority_counts = {}
        for task in tasks:
            priority_counts[task.priority] = priority_counts.get(task.priority, 0) + 1
        
        # Weather dependency
        weather_dependent = len([t for t in tasks if t.weather_dependency])
        
        return {
            'total_tasks': total_tasks,
            'total_duration_hours': round(total_duration / 60, 1),
            'total_cost': round(total_cost, 2),
            'cost_per_hectare': round(total_cost / field_area, 2) if field_area > 0 else 0,
            'tasks_by_category': category_counts,
            'tasks_by_priority': priority_counts,
            'weather_dependent_tasks': weather_dependent,
            'weather_dependency_percentage': round((weather_dependent / total_tasks) * 100, 1) if total_tasks > 0 else 0
        }
    
    def _generate_plan_recommendations(self, 
                                     crop_type: str,
                                     tasks: List[FarmingTask],
                                     available_resources: Dict,
                                     plan_stats: Dict) -> List[Dict[str, str]]:
        """Generate recommendations for the farming plan"""
        recommendations = []
        
        # Resource recommendations
        if plan_stats['weather_dependent_tasks'] > len(tasks) * 0.6:
            recommendations.append({
                'type': 'weather_planning',
                'title': 'مراقبة الطقس',
                'description': f"أكثر من {plan_stats['weather_dependency_percentage']}% من المهام تعتمد على الطقس. احرص على مراقبة توقعات الطقس بانتظام."
            })
        
        # Cost optimization
        if plan_stats['cost_per_hectare'] > 5000:
            recommendations.append({
                'type': 'cost_optimization',
                'title': 'تحسين التكاليف',
                'description': f"التكلفة المقدرة عالية ({plan_stats['cost_per_hectare']} د.ت/هكتار). فكر في تحسين استخدام الموارد أو البحث عن بدائل اقتصادية."
            })
        
        # Task distribution
        if plan_stats['tasks_by_priority'].get('high', 0) > len(tasks) * 0.4:
            recommendations.append({
                'type': 'priority_management',
                'title': 'إدارة الأولويات',
                'description': "عدد كبير من المهام عالية الأولوية. فكر في توزيع العمل أو تأجيل بعض المهام غير الحرجة."
            })
        
        # Seasonal recommendations
        recommendations.append({
            'type': 'seasonal_planning',
            'title': 'التخطيط الموسمي',
            'description': f"تأكد من توفر الموارد اللازمة لمحصول {crop_type} طوال الموسم، خاصة في فترات الذروة."
        })
        
        return recommendations
    
    def _detect_scheduling_conflicts(self, tasks: List[FarmingTask]) -> List[Dict[str, Any]]:
        """Detect scheduling conflicts between tasks"""
        conflicts = []
        
        for i, task1 in enumerate(tasks):
            for j, task2 in enumerate(tasks[i+1:], i+1):
                if not task1.scheduled_date or not task2.scheduled_date:
                    continue
                
                # Check for resource conflicts
                if (task1.scheduled_date.date() == task2.scheduled_date.date() and
                    task1.field_id == task2.field_id and
                    any(resource in task2.required_resources for resource in task1.required_resources)):
                    
                    conflicts.append({
                        'type': 'resource_conflict',
                        'task1': task1.id,
                        'task2': task2.id,
                        'date': task1.scheduled_date.date().isoformat(),
                        'conflicting_resources': list(set(task1.required_resources) & set(task2.required_resources)),
                        'resolved': False
                    })
        
        return conflicts
    
    def _resolve_conflicts(self, 
                          tasks: List[FarmingTask],
                          conflicts: List[Dict],
                          constraints: Dict) -> List[FarmingTask]:
        """Resolve scheduling conflicts"""
        optimized_tasks = tasks.copy()
        
        for conflict in conflicts:
            task1 = next(t for t in optimized_tasks if t.id == conflict['task1'])
            task2 = next(t for t in optimized_tasks if t.id == conflict['task2'])
            
            # Resolve by priority
            if task1.priority == 'high' and task2.priority != 'high':
                # Keep task1, reschedule task2
                task2.scheduled_date = self._find_alternative_date(task2, optimized_tasks)
                conflict['resolved'] = True
            elif task2.priority == 'high' and task1.priority != 'high':
                # Keep task2, reschedule task1
                task1.scheduled_date = self._find_alternative_date(task1, optimized_tasks)
                conflict['resolved'] = True
            else:
                # Both same priority, reschedule the later one
                if task1.scheduled_date > task2.scheduled_date:
                    task1.scheduled_date = self._find_alternative_date(task1, optimized_tasks)
                else:
                    task2.scheduled_date = self._find_alternative_date(task2, optimized_tasks)
                conflict['resolved'] = True
        
        return optimized_tasks
    
    def _find_alternative_date(self, task: FarmingTask, existing_tasks: List[FarmingTask]) -> datetime:
        """Find alternative date for conflicted task"""
        original_date = task.scheduled_date
        
        # Try next few days
        for days_offset in range(1, 8):
            alternative_date = original_date + timedelta(days=days_offset)
            
            # Check if date is conflict-free
            conflicts = any(
                t.scheduled_date and t.scheduled_date.date() == alternative_date.date() and
                t.field_id == task.field_id and t.id != task.id and
                any(resource in t.required_resources for resource in task.required_resources)
                for t in existing_tasks
            )
            
            if not conflicts:
                return alternative_date
        
        # If no alternative found, return date one week later
        return original_date + timedelta(days=7)
    
    def _optimize_resource_allocation(self, 
                                    tasks: List[FarmingTask],
                                    constraints: Dict) -> List[FarmingTask]:
        """Optimize resource allocation across tasks"""
        # Simple resource optimization - group similar tasks
        optimized_tasks = tasks.copy()
        
        # Group tasks by resource requirements for efficient scheduling
        resource_groups = {}
        for task in optimized_tasks:
            for resource in task.required_resources:
                if resource not in resource_groups:
                    resource_groups[resource] = []
                resource_groups[resource].append(task)
        
        # Optimize scheduling within resource groups
        for resource, resource_tasks in resource_groups.items():
            resource_tasks.sort(key=lambda x: (x.scheduled_date, x.priority))
        
        return optimized_tasks
    
    def _optimize_weather_dependencies(self, tasks: List[FarmingTask]) -> List[FarmingTask]:
        """Optimize scheduling of weather-dependent tasks"""
        optimized_tasks = tasks.copy()
        
        for task in optimized_tasks:
            if task.weather_dependency and task.scheduled_date:
                # Check if scheduled date is in optimal weather window
                if not self._is_optimal_weather_window(task.scheduled_date):
                    # Find better weather window
                    optimal_date = self._find_optimal_weather_date(task.scheduled_date)
                    if optimal_date:
                        task.scheduled_date = optimal_date
        
        return optimized_tasks
    
    def _find_optimal_weather_date(self, original_date: datetime) -> Optional[datetime]:
        """Find optimal weather date near original date"""
        # Simple heuristic - avoid July, August, December, January
        for days_offset in range(-3, 8):
            candidate_date = original_date + timedelta(days=days_offset)
            if self._is_optimal_weather_window(candidate_date):
                return candidate_date
        
        return None
    
    def _calculate_optimization_metrics(self, 
                                      original_tasks: List[FarmingTask],
                                      optimized_tasks: List[FarmingTask]) -> Dict[str, Any]:
        """Calculate optimization performance metrics"""
        
        # Calculate schedule efficiency
        original_duration = max(
            (task.scheduled_date for task in original_tasks if task.scheduled_date),
            default=datetime.now()
        ) - min(
            (task.scheduled_date for task in original_tasks if task.scheduled_date),
            default=datetime.now()
        )
        
        optimized_duration = max(
            (task.scheduled_date for task in optimized_tasks if task.scheduled_date),
            default=datetime.now()
        ) - min(
            (task.scheduled_date for task in optimized_tasks if task.scheduled_date),
            default=datetime.now()
        )
        
        return {
            'schedule_compression_days': (original_duration - optimized_duration).days,
            'weather_optimization_percentage': len([
                t for t in optimized_tasks 
                if t.weather_dependency and self._is_optimal_weather_window(t.scheduled_date)
            ]) / len([t for t in optimized_tasks if t.weather_dependency]) * 100 if any(t.weather_dependency for t in optimized_tasks) else 0,
            'resource_utilization_score': 85  # Placeholder metric
        }
    
    def _generate_optimization_notes(self, 
                                   optimized_tasks: List[FarmingTask],
                                   conflicts: List[Dict]) -> List[str]:
        """Generate optimization notes and recommendations"""
        notes = []
        
        if conflicts:
            resolved_conflicts = len([c for c in conflicts if c.get('resolved')])
            notes.append(f"تم حل {resolved_conflicts} من أصل {len(conflicts)} تضارب في الجدولة")
        
        weather_tasks = len([t for t in optimized_tasks if t.weather_dependency])
        if weather_tasks > 0:
            notes.append(f"تم تحسين جدولة {weather_tasks} مهمة تعتمد على الطقس")
        
        notes.append("تم تحسين توزيع الموارد لتقليل التضارب")
        notes.append("احرص على مراجعة الجدولة بانتظام حسب الظروف المتغيرة")
        
        return notes
    
    def _get_priority_score(self, task: FarmingTask) -> int:
        """Get numeric priority score for sorting"""
        priority_scores = {'high': 1, 'medium': 2, 'low': 3}
        urgency_scores = {'immediate': 1, 'within_week': 2, 'within_month': 3, 'seasonal': 4}
        
        return priority_scores.get(task.priority, 2) * 10 + urgency_scores.get(task.urgency, 4)
    
    def _generate_daily_recommendations(self, 
                                      daily_tasks: List[FarmingTask],
                                      upcoming_tasks: List[FarmingTask],
                                      date: datetime) -> List[Dict[str, str]]:
        """Generate daily task recommendations"""
        recommendations = []
        
        if not daily_tasks:
            recommendations.append({
                'type': 'no_tasks',
                'title': 'لا توجد مهام مجدولة',
                'description': 'يوم هادئ! يمكنك الاستفادة من الوقت في الصيانة العامة أو التخطيط للمهام القادمة.'
            })
        
        high_priority_tasks = [t for t in daily_tasks if t.priority == 'high']
        if high_priority_tasks:
            recommendations.append({
                'type': 'high_priority',
                'title': 'مهام عالية الأولوية',
                'description': f'لديك {len(high_priority_tasks)} مهمة عالية الأولوية اليوم. ابدأ بها في أول النهار.'
            })
        
        weather_tasks = [t for t in daily_tasks if t.weather_dependency]
        if weather_tasks:
            recommendations.append({
                'type': 'weather_check',
                'title': 'فحص الطقس',
                'description': f'{len(weather_tasks)} مه��ة تعتمد على الطقس. تأكد من مراجعة توقعات الطقس قبل البدء.'
            })
        
        return recommendations
    
    def _check_task_conflicts(self, new_task: FarmingTask) -> List[Dict[str, Any]]:
        """Check for conflicts with existing tasks"""
        conflicts = []
        
        if not new_task.scheduled_date:
            return conflicts
        
        for existing_task in self.tasks:
            if (existing_task.scheduled_date and
                existing_task.scheduled_date.date() == new_task.scheduled_date.date() and
                existing_task.field_id == new_task.field_id):
                
                # Check resource conflicts
                conflicting_resources = list(set(existing_task.required_resources) & set(new_task.required_resources))
                if conflicting_resources:
                    conflicts.append({
                        'type': 'resource_conflict',
                        'existing_task': existing_task.id,
                        'conflicting_resources': conflicting_resources
                    })
        
        return conflicts
    
    def _find_optimal_schedule_date(self, task: FarmingTask) -> datetime:
        """Find optimal scheduling date for a task"""
        # Start with current date + 1 day
        candidate_date = datetime.now() + timedelta(days=1)
        
        # Check seasonal constraints
        if hasattr(task, 'seasonal_window'):
            start_month, end_month = task.seasonal_window
            current_month = candidate_date.month
            
            if start_month <= end_month:
                # Normal season (e.g., March to June)
                if not (start_month <= current_month <= end_month):
                    candidate_date = datetime(candidate_date.year, start_month, 1)
            else:
                # Cross-year season (e.g., October to February)
                if not (current_month >= start_month or current_month <= end_month):
                    candidate_date = datetime(candidate_date.year, start_month, 1)
        
        # Find conflict-free date
        for days_offset in range(0, 30):
            test_date = candidate_date + timedelta(days=days_offset)
            
            # Check for conflicts
            conflicts = any(
                t.scheduled_date and t.scheduled_date.date() == test_date.date() and
                t.field_id == task.field_id and
                any(resource in t.required_resources for resource in task.required_resources)
                for t in self.tasks
            )
            
            if not conflicts:
                return test_date
        
        # If no optimal date found, return candidate + 30 days
        return candidate_date + timedelta(days=30)
    
    def _get_dependent_tasks(self, task_id: str) -> List[FarmingTask]:
        """Get tasks that depend on the specified task"""
        return [task for task in self.tasks if task_id in task.prerequisites]
    
    def _task_to_dict(self, task: FarmingTask) -> Dict[str, Any]:
        """Convert task object to dictionary"""
        return {
            'id': task.id,
            'name': task.name,
            'name_ar': task.name_ar,
            'category': task.category,
            'priority': task.priority,
            'urgency': task.urgency,
            'crop_type': task.crop_type,
            'field_id': task.field_id,
            'estimated_duration_minutes': task.estimated_duration,
            'estimated_duration_hours': round(task.estimated_duration / 60, 1),
            'required_resources': task.required_resources,
            'prerequisites': task.prerequisites,
            'weather_dependency': task.weather_dependency,
            'seasonal_window': task.seasonal_window,
            'optimal_conditions': task.optimal_conditions,
            'cost_estimate': task.cost_estimate,
            'expected_outcome': task.expected_outcome,
            'instructions': task.instructions,
            'safety_requirements': task.safety_requirements,
            'created_at': task.created_at.isoformat(),
            'scheduled_date': task.scheduled_date.isoformat() if task.scheduled_date else None,
            'completed_at': task.completed_at.isoformat() if task.completed_at else None,
            'status': task.status
        }
    
    def get_task_statistics(self) -> Dict[str, Any]:
        """Get comprehensive task statistics"""
        total_tasks = len(self.tasks)
        
        if total_tasks == 0:
            return {'total_tasks': 0, 'message': 'No tasks available'}
        
        # Status distribution
        status_counts = {}
        for task in self.tasks:
            status_counts[task.status] = status_counts.get(task.status, 0) + 1
        
        # Category distribution
        category_counts = {}
        for task in self.tasks:
            category_counts[task.category] = category_counts.get(task.category, 0) + 1
        
        # Priority distribution
        priority_counts = {}
        for task in self.tasks:
            priority_counts[task.priority] = priority_counts.get(task.priority, 0) + 1
        
        # Performance metrics
        completed_tasks = [t for t in self.tasks if t.status == 'completed']
        completion_rate = len(completed_tasks) / total_tasks * 100 if total_tasks > 0 else 0
        
        return {
            'total_tasks': total_tasks,
            'completion_rate_percentage': round(completion_rate, 1),
            'status_distribution': status_counts,
            'category_distribution': category_counts,
            'priority_distribution': priority_counts,
            'upcoming_tasks': len([t for t in self.tasks if t.scheduled_date and t.scheduled_date > datetime.now()]),
            'overdue_tasks': len([t for t in self.tasks if t.scheduled_date and t.scheduled_date < datetime.now() and t.status != 'completed'])
        }
