<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('board_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('board_id');
            $table->unsignedInteger('version');
            $table->jsonb('content_json');
            $table->timestamps();

            $table->unique(['board_id', 'version']);
            $table->index('board_id');
            $table->foreign('board_id')->references('id')->on('boards')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('board_documents');
    }
};
