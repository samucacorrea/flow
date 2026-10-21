<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'workspace_id',
        'name',
        'type',
        'settings_json',
    ];

    protected $casts = [
        'settings_json' => 'array',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function documents()
    {
        return $this->hasMany(BoardDocument::class);
    }
}
