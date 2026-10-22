<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Laravel\Cashier\Billable;

class Workspace extends Model
{
    use HasFactory;
    use HasUuids;
    use Billable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'plan',
        'subscription_status',
        'manual_plan',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'manual_plan' => 'boolean',
    ];

    public function members()
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function boards()
    {
        return $this->hasMany(Board::class);
    }
}
