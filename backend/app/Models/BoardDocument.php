<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoardDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'version',
        'content_json',
    ];

    protected $casts = [
        'content_json' => 'array',
    ];

    public function board()
    {
        return $this->belongsTo(Board::class);
    }
}
